/**
 * Tests de sécurité - Multi-Tenant Strict pour Figures
 * Date: 2026-01-10
 * Description: Vérifie l'isolation stricte des figures entre écoles
 */

const request = require('supertest');
const app = require('../../server');
const { sequelize } = require('../../db');
const Figure = require('../../src/models/Figure');
const Utilisateur = require('../../src/models/Utilisateur');
const Ecole = require('../../src/models/Ecole');
const Discipline = require('../../src/models/Discipline');
const jwt = require('jsonwebtoken');

describe('Sécurité Multi-Tenant - Figures', () => {
  let adminToken, prof1Token, prof2Token, eleve1Token;
  let ecole1, ecole2, discipline, publicFigure, ecole1Figure, ecole2Figure;
  let admin, prof1, prof2, eleve1;

  beforeAll(async () => {
    // Reset database
    await sequelize.sync({ force: true });

    // Créer 2 écoles
    ecole1 = await Ecole.create({
      nom: 'École Test 1',
      adresse: '1 rue Test',
      type_abonnement: 'basic',
      statut_abonnement: 'actif'
    });

    ecole2 = await Ecole.create({
      nom: 'École Test 2',
      adresse: '2 rue Test',
      type_abonnement: 'basic',
      statut_abonnement: 'actif'
    });

    // Créer discipline
    discipline = await Discipline.create({
      nom: 'Test Discipline',
      description: 'Pour tests'
    });

    // Créer utilisateurs
    admin = await Utilisateur.create({
      nom: 'Admin',
      prenom: 'Master',
      email: 'admin@test.com',
      mot_de_passe: 'password123',
      role: 'admin',
      ecole_id: null
    });

    prof1 = await Utilisateur.create({
      nom: 'Prof',
      prenom: 'Ecole1',
      email: 'prof1@test.com',
      mot_de_passe: 'password123',
      role: 'professeur',
      ecole_id: ecole1.id
    });

    prof2 = await Utilisateur.create({
      nom: 'Prof',
      prenom: 'Ecole2',
      email: 'prof2@test.com',
      mot_de_passe: 'password123',
      role: 'professeur',
      ecole_id: ecole2.id
    });

    eleve1 = await Utilisateur.create({
      nom: 'Eleve',
      prenom: 'Ecole1',
      email: 'eleve1@test.com',
      mot_de_passe: 'password123',
      role: 'eleve',
      ecole_id: ecole1.id
    });

    // Créer figures
    publicFigure = await Figure.create({
      nom: 'Figure Publique',
      descriptif: 'Catalogue public',
      discipline_id: discipline.id,
      ecole_id: null,
      visibilite: 'public',
      createur_id: admin.id
    });

    ecole1Figure = await Figure.create({
      nom: 'Figure École 1',
      descriptif: 'Privée école 1',
      discipline_id: discipline.id,
      ecole_id: ecole1.id,
      visibilite: 'ecole',
      createur_id: prof1.id
    });

    ecole2Figure = await Figure.create({
      nom: 'Figure École 2',
      descriptif: 'Privée école 2',
      discipline_id: discipline.id,
      ecole_id: ecole2.id,
      visibilite: 'ecole',
      createur_id: prof2.id
    });

    // Générer tokens JWT
    adminToken = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET || 'test_secret');
    prof1Token = jwt.sign({ id: prof1.id, role: prof1.role, ecole_id: prof1.ecole_id }, process.env.JWT_SECRET || 'test_secret');
    prof2Token = jwt.sign({ id: prof2.id, role: prof2.role, ecole_id: prof2.ecole_id }, process.env.JWT_SECRET || 'test_secret');
    eleve1Token = jwt.sign({ id: eleve1.id, role: eleve1.role, ecole_id: eleve1.ecole_id }, process.env.JWT_SECRET || 'test_secret');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // TEST 1: Professeurs voient UNIQUEMENT figures de leur école
  describe('GET /api/figures - Filtrage strict', () => {
    test('Professeur École 1 voit UNIQUEMENT figures école 1 (pas catalogue public)', async () => {
      const response = await request(app)
        .get('/api/figures')
        .set('Authorization', `Bearer ${prof1Token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Doit voir uniquement figure école 1
      const figureIds = response.body.map(f => f.id);
      expect(figureIds).toContain(ecole1Figure.id);
      expect(figureIds).not.toContain(publicFigure.id); // ❌ NE DOIT PAS voir catalogue public
      expect(figureIds).not.toContain(ecole2Figure.id);  // ❌ NE DOIT PAS voir autre école
    });

    test('Élève École 1 voit UNIQUEMENT figures école 1 (pas catalogue public)', async () => {
      const response = await request(app)
        .get('/api/figures')
        .set('Authorization', `Bearer ${eleve1Token}`);

      expect(response.status).toBe(200);

      const figureIds = response.body.map(f => f.id);
      expect(figureIds).toContain(ecole1Figure.id);
      expect(figureIds).not.toContain(publicFigure.id); // ❌ Pas de catalogue public
      expect(figureIds).not.toContain(ecole2Figure.id);
    });

    test('Admin voit TOUTES les figures (public + toutes écoles)', async () => {
      const response = await request(app)
        .get('/api/figures')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const figureIds = response.body.map(f => f.id);
      expect(figureIds).toContain(publicFigure.id);   // ✅ Voit catalogue public
      expect(figureIds).toContain(ecole1Figure.id);   // ✅ Voit école 1
      expect(figureIds).toContain(ecole2Figure.id);   // ✅ Voit école 2
    });
  });

  // TEST 2: Modification du catalogue public bloquée
  describe('PUT /api/admin/figures/:id - Protection catalogue public', () => {
    test('Professeur ne peut PAS modifier catalogue public (403)', async () => {
      const response = await request(app)
        .put(`/api/admin/figures/${publicFigure.id}`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({ nom: 'Tentative Hack' });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/Accès refusé|permissions/i);

      // Vérifier que la figure n'a pas été modifiée
      const figure = await Figure.findByPk(publicFigure.id);
      expect(figure.nom).toBe('Figure Publique');
    });

    test('Professeur ne peut PAS modifier figures autre école (403)', async () => {
      const response = await request(app)
        .put(`/api/admin/figures/${ecole2Figure.id}`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({ nom: 'Tentative Hack Cross-École' });

      expect(response.status).toBe(403);

      // Vérifier non modifié
      const figure = await Figure.findByPk(ecole2Figure.id);
      expect(figure.nom).toBe('Figure École 2');
    });

    test('Professeur PEUT modifier ses propres figures de son école', async () => {
      const response = await request(app)
        .put(`/api/admin/figures/${ecole1Figure.id}`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({ nom: 'Figure École 1 Modifiée' });

      expect(response.status).toBe(200);

      const figure = await Figure.findByPk(ecole1Figure.id);
      expect(figure.nom).toBe('Figure École 1 Modifiée');
    });

    test('Admin PEUT modifier catalogue public', async () => {
      const response = await request(app)
        .put(`/api/admin/figures/${publicFigure.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nom: 'Figure Publique Admin' });

      expect(response.status).toBe(200);

      const figure = await Figure.findByPk(publicFigure.id);
      expect(figure.nom).toBe('Figure Publique Admin');
    });
  });

  // TEST 3: Création force bon ecole_id
  describe('POST /api/admin/figures - Force ecole_id', () => {
    test('Professeur: ecole_id forcé à son école (ignore input client)', async () => {
      const response = await request(app)
        .post('/api/admin/figures')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({
          nom: 'Nouvelle Figure Prof1',
          discipline_id: discipline.id,
          ecole_id: 999 // ❌ Tentative de créer pour autre école
        });

      expect(response.status).toBe(201);

      // Vérifier que ecole_id a été forcé à école 1
      const figure = await Figure.findOne({ where: { nom: 'Nouvelle Figure Prof1' } });
      expect(figure).toBeTruthy();
      expect(figure.ecole_id).toBe(ecole1.id); // ✅ Forcé à école du prof
      expect(figure.ecole_id).not.toBe(999);    // ❌ Pas celui envoyé
      expect(figure.visibilite).toBe('ecole');
    });

    test('Admin: peut créer figure publique (ecole_id null)', async () => {
      const response = await request(app)
        .post('/api/admin/figures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nom: 'Nouvelle Figure Publique',
          discipline_id: discipline.id,
          ecole_id: null
        });

      expect(response.status).toBe(201);

      const figure = await Figure.findOne({ where: { nom: 'Nouvelle Figure Publique' } });
      expect(figure.ecole_id).toBeNull();
      expect(figure.visibilite).toBe('public');
    });

    test('Admin: peut créer figure pour école spécifique', async () => {
      const response = await request(app)
        .post('/api/admin/figures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nom: 'Figure Admin pour École 2',
          discipline_id: discipline.id,
          ecole_id: ecole2.id
        });

      expect(response.status).toBe(201);

      const figure = await Figure.findOne({ where: { nom: 'Figure Admin pour École 2' } });
      expect(figure.ecole_id).toBe(ecole2.id);
      expect(figure.visibilite).toBe('ecole');
    });
  });

  // TEST 4: Suppression du catalogue public bloquée
  describe('DELETE /api/admin/figures/:id - Protection catalogue public', () => {
    test('Professeur ne peut PAS supprimer catalogue public (403)', async () => {
      const response = await request(app)
        .delete(`/api/admin/figures/${publicFigure.id}`)
        .set('Authorization', `Bearer ${prof1Token}`);

      expect(response.status).toBe(403);

      // Vérifier que la figure existe toujours
      const figure = await Figure.findByPk(publicFigure.id);
      expect(figure).toBeTruthy();
    });

    test('Professeur ne peut PAS supprimer figures autre école (403)', async () => {
      const response = await request(app)
        .delete(`/api/admin/figures/${ecole2Figure.id}`)
        .set('Authorization', `Bearer ${prof1Token}`);

      expect(response.status).toBe(403);

      const figure = await Figure.findByPk(ecole2Figure.id);
      expect(figure).toBeTruthy();
    });
  });

  // TEST 5: Validation modèle (visibilite consistency)
  describe('Modèle Figure - Validation visibilite', () => {
    test('Création figure publique (ecole_id null) avec visibilite!=public échoue', async () => {
      await expect(
        Figure.create({
          nom: 'Figure Invalid',
          discipline_id: discipline.id,
          ecole_id: null,
          visibilite: 'ecole', // ❌ Incohérent avec ecole_id null
          createur_id: admin.id
        })
      ).rejects.toThrow(/visibilite=public/i);
    });

    test('Création figure école avec visibilite!=ecole échoue', async () => {
      await expect(
        Figure.create({
          nom: 'Figure Invalid 2',
          discipline_id: discipline.id,
          ecole_id: ecole1.id,
          visibilite: 'public', // ❌ Incohérent avec ecole_id non null
          createur_id: prof1.id
        })
      ).rejects.toThrow(/visibilite=ecole/i);
    });
  });
});

module.exports = {};
