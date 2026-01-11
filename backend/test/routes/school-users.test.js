const request = require('supertest');
const app = require('../../server');
const { Utilisateur, Ecole } = require('../../src/models');

// Helper pour login
async function loginUser(email, password) {
  const res = await request(app)
    .post('/api/utilisateurs/login')
    .send({ email, mot_de_passe: password });

  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.body.error}`);
  }

  return res.body.token;
}

describe('School Users Management Routes', () => {
  let adminToken, prof1Token, prof2Token, eleve1Token;
  let ecole1, ecole2, admin, prof1, prof2, eleve1;

  beforeAll(async () => {
    // Récupérer les tokens depuis les données seed
    adminToken = await loginUser('admin1@example.com', 'admin123');
    prof1Token = await loginUser('prof1@example.com', 'prof123');
    prof2Token = await loginUser('prof2@example.com', 'prof123');
    eleve1Token = await loginUser('user1@example.com', 'user123');

    // Récupérer les données seed
    admin = await Utilisateur.findOne({ where: { email: 'admin1@example.com' } });
    prof1 = await Utilisateur.findOne({ where: { email: 'prof1@example.com' } });
    prof2 = await Utilisateur.findOne({ where: { email: 'prof2@example.com' } });
    eleve1 = await Utilisateur.findOne({ where: { email: 'user1@example.com' } });
    ecole1 = await Ecole.findOne({ where: { nom: 'École de Cirque Voltige' } });
    ecole2 = await Ecole.findOne({ where: { nom: 'École Trapèze Premium' } });
  });

  describe('GET /api/school/users', () => {
    test('Admin peut lister tous les utilisateurs (ou filtrer par école)', async () => {
      const res = await request(app)
        .get('/api/school/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('Professeur peut lister utilisateurs de son école uniquement', async () => {
      const res = await request(app)
        .get('/api/school/users')
        .set('Authorization', `Bearer ${prof1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Tous les utilisateurs doivent appartenir à l'école du prof
      res.body.forEach(user => {
        expect(user.ecole_id).toBe(prof1.ecole_id);
      });
    });

    test('Professeur ne voit PAS les utilisateurs d\'une autre école', async () => {
      const res = await request(app)
        .get('/api/school/users')
        .set('Authorization', `Bearer ${prof1Token}`);

      expect(res.status).toBe(200);

      // Vérifier qu'aucun utilisateur de ecole2 n'est présent
      const hasEcole2Users = res.body.some(user => user.ecole_id === ecole2.id);
      expect(hasEcole2Users).toBe(false);
    });

    test('Utilisateur sans école (solo) ne peut pas lister', async () => {
      // Créer temporairement un utilisateur solo
      const soloUser = await Utilisateur.create({
        pseudo: 'solo-test',
        prenom: 'Solo',
        nom: 'User',
        email: 'solo@test.com',
        password: 'password123',
        role: 'eleve',
        ecole_id: null
      });

      const soloToken = await loginUser('solo@test.com', 'password123');

      const res = await request(app)
        .get('/api/school/users')
        .set('Authorization', `Bearer ${soloToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('affilié à une école');

      // Nettoyer
      await soloUser.destroy();
    });
  });

  describe('POST /api/school/users', () => {
    test('Admin peut créer un utilisateur avec école spécifique', async () => {
      const res = await request(app)
        .post('/api/school/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          prenom: 'Nouveau',
          nom: 'Professeur',
          email: 'nouveau.prof@test.com',
          role: 'professeur',
          ecole_id: ecole1.id
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('créé avec succès');
      expect(res.body.utilisateur.ecole_id).toBe(ecole1.id);
      expect(res.body.defaultPassword).toBeDefined(); // Mot de passe par défaut généré

      // Nettoyer
      await Utilisateur.destroy({ where: { email: 'nouveau.prof@test.com' } });
    });

    test('Professeur peut créer élève dans SON école (ecole_id forcé)', async () => {
      const res = await request(app)
        .post('/api/school/users')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({
          prenom: 'Nouvel',
          nom: 'Élève',
          email: 'nouvel.eleve@test.com',
          role: 'eleve',
          ecole_id: ecole2.id // Tentative de mettre autre école (doit être ignoré)
        });

      expect(res.status).toBe(201);
      expect(res.body.utilisateur.ecole_id).toBe(prof1.ecole_id); // Forcé à l'école du prof
      expect(res.body.utilisateur.ecole_id).not.toBe(ecole2.id);

      // Nettoyer
      await Utilisateur.destroy({ where: { email: 'nouvel.eleve@test.com' } });
    });

    test('Création échoue si email déjà utilisé', async () => {
      const res = await request(app)
        .post('/api/school/users')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({
          prenom: 'Duplicate',
          nom: 'Email',
          email: eleve1.email, // Email existant
          role: 'eleve'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('email est déjà utilisé');
    });

    test('Création échoue si limite élèves atteinte', async () => {
      // Modifier temporairement la limite de l'école
      const originalMaxEleves = ecole1.max_eleves;
      await ecole1.update({ max_eleves: 0 }); // Limite à 0

      const res = await request(app)
        .post('/api/school/users')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({
          prenom: 'Over',
          nom: 'Limit',
          email: 'over.limit@test.com',
          role: 'eleve'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Limite d\'élèves atteinte');

      // Restaurer
      await ecole1.update({ max_eleves: originalMaxEleves });
    });

    test('Génération automatique pseudo si non fourni', async () => {
      const res = await request(app)
        .post('/api/school/users')
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({
          prenom: 'AutoPseudo',
          nom: 'Test',
          email: 'autopseudo@test.com',
          role: 'eleve'
        });

      expect(res.status).toBe(201);
      expect(res.body.utilisateur.pseudo).toBeDefined();
      expect(res.body.utilisateur.pseudo).toMatch(/^[a-z]{3}-autopseudo\.test/);

      // Nettoyer
      await Utilisateur.destroy({ where: { email: 'autopseudo@test.com' } });
    });
  });

  describe('PUT /api/school/users/:id', () => {
    let tempUser;

    beforeEach(async () => {
      // Créer utilisateur temporaire
      tempUser = await Utilisateur.create({
        pseudo: 'temp-user',
        prenom: 'Temp',
        nom: 'User',
        email: 'temp.user@test.com',
        password: 'password123',
        role: 'eleve',
        ecole_id: ecole1.id
      });
    });

    afterEach(async () => {
      if (tempUser) {
        await Utilisateur.destroy({ where: { id: tempUser.id } });
      }
    });

    test('Professeur peut modifier utilisateur de SON école', async () => {
      const res = await request(app)
        .put(`/api/school/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({
          prenom: 'TempModifié',
          nom: 'UserModifié'
        });

      expect(res.status).toBe(200);
      expect(res.body.utilisateur.prenom).toBe('TempModifié');
      expect(res.body.utilisateur.nom).toBe('UserModifié');
    });

    test('Professeur ne peut PAS modifier utilisateur d\'autre école', async () => {
      const res = await request(app)
        .put(`/api/school/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${prof2Token}`) // Prof d'école2
        .send({
          prenom: 'Hacker',
          nom: 'Attempt'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('votre école');
    });

    test('Modification email vérifie l\'unicité', async () => {
      const res = await request(app)
        .put(`/api/school/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${prof1Token}`)
        .send({
          email: eleve1.email // Email déjà utilisé
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('email est déjà utilisé');
    });
  });

  describe('DELETE /api/school/users/:id', () => {
    let tempUser;

    beforeEach(async () => {
      tempUser = await Utilisateur.create({
        pseudo: 'temp-delete',
        prenom: 'TempDelete',
        nom: 'User',
        email: 'temp.delete@test.com',
        password: 'password123',
        role: 'eleve',
        ecole_id: ecole1.id
      });
    });

    afterEach(async () => {
      // Tentative nettoyage si test échoue
      try {
        await Utilisateur.destroy({ where: { email: 'temp.delete@test.com' } });
      } catch (e) {
        // Ignoré si déjà supprimé
      }
    });

    test('Professeur peut supprimer utilisateur de SON école', async () => {
      const res = await request(app)
        .delete(`/api/school/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${prof1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('supprimé avec succès');

      // Vérifier suppression effective
      const deleted = await Utilisateur.findByPk(tempUser.id);
      expect(deleted).toBeNull();
    });

    test('Professeur ne peut PAS supprimer utilisateur d\'autre école', async () => {
      const res = await request(app)
        .delete(`/api/school/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${prof2Token}`); // École différente

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('votre école');
    });

    test('Utilisateur ne peut PAS se supprimer lui-même', async () => {
      const res = await request(app)
        .delete(`/api/school/users/${prof1.id}`)
        .set('Authorization', `Bearer ${prof1Token}`); // Tentative auto-suppression

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('vous-même');
    });
  });

  describe('POST /api/school/users/:id/archive', () => {
    let tempUser;

    beforeEach(async () => {
      tempUser = await Utilisateur.create({
        pseudo: 'temp-archive',
        prenom: 'TempArchive',
        nom: 'User',
        email: 'temp.archive@test.com',
        password: 'password123',
        role: 'eleve',
        ecole_id: ecole1.id,
        actif: true
      });
    });

    afterEach(async () => {
      await Utilisateur.destroy({ where: { id: tempUser.id } });
    });

    test('Professeur peut archiver utilisateur de SON école', async () => {
      const res = await request(app)
        .post(`/api/school/users/${tempUser.id}/archive`)
        .set('Authorization', `Bearer ${prof1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('archivé avec succès');
      expect(res.body.utilisateur.actif).toBe(false);

      // Vérifier en DB
      await tempUser.reload();
      expect(tempUser.actif).toBe(false);
    });

    test('Professeur ne peut PAS archiver utilisateur d\'autre école', async () => {
      const res = await request(app)
        .post(`/api/school/users/${tempUser.id}/archive`)
        .set('Authorization', `Bearer ${prof2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('votre école');
    });
  });
});
