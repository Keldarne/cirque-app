/**
 * Tests pour les routes CRUD des disciplines (Master Admin Only)
 * Vérifie: création, modification, suppression, protection contre suppression avec figures liées
 *
 * NOTE: Ces tests nécessitent que le serveur soit en cours d'exécution et que la base soit seeded
 * Exécuter: npm run reset-and-seed avant de lancer ces tests
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');
const { Discipline, Figure } = require('../../src/models');

describe('Admin Disciplines CRUD', () => {
  let adminToken;
  let professeurToken;
  let disciplineId;

  beforeAll(async () => {
    // Attendre que le serveur soit prêt
    await waitForServer();

    // Login avec les comptes de seed
    let loginResponse;

    loginResponse = await loginAs.admin();
    adminToken = loginResponse.token;

    loginResponse = await loginAs.professeur();
    professeurToken = loginResponse.token;
  });

  describe('POST /api/admin/disciplines', () => {
    it('should create a new discipline (master admin)', async () => {
      const res = await authRequest.post('/admin/disciplines', adminToken, {
        nom: 'Acrobatie Test CRUD',
        description: 'Discipline de test',
        image_url: 'http://example.com/image.jpg'
      });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data.nom).toBe('Acrobatie Test CRUD');
      expect(res.data.description).toBe('Discipline de test');
      expect(res.data.image_url).toBe('http://example.com/image.jpg');

      disciplineId = res.data.id; // Save for later tests
    });

    it('should reject creation without nom', async () => {
      const res = await authRequest.post('/admin/disciplines', adminToken, {
        description: 'Sans nom'
      });

      expect(res.status).toBe(400);
      expect(res.data.message).toContain('requis');
    });

    it('should reject creation by professeur (not admin)', async () => {
      const res = await authRequest.post('/admin/disciplines', professeurToken, {
        nom: 'Test'
      });

      expect(res.status).toBe(403);
    });

    it('should trim whitespace from nom', async () => {
      const res = await authRequest.post('/admin/disciplines', adminToken, {
        nom: '  Jonglerie Test CRUD  '
      });

      expect(res.status).toBe(201);
      expect(res.data.nom).toBe('Jonglerie Test CRUD');
    });
  });

  describe('PUT /api/admin/disciplines/:id', () => {
    it('should update an existing discipline (master admin)', async () => {
      const res = await authRequest.put(`/admin/disciplines/${disciplineId}`, adminToken, {
        nom: 'Acrobatie Modifiée',
        description: 'Description modifiée'
      });

      expect(res.status).toBe(200);
      expect(res.data.nom).toBe('Acrobatie Modifiée');
      expect(res.data.description).toBe('Description modifiée');
    });

    it('should return 404 for non-existent discipline', async () => {
      const res = await authRequest.put('/admin/disciplines/99999', adminToken, {
        nom: 'Test'
      });

      expect(res.status).toBe(404);
    });

    it('should reject update without nom', async () => {
      const res = await authRequest.put(`/admin/disciplines/${disciplineId}`, adminToken, {
        nom: ''
      });

      expect(res.status).toBe(400);
    });

    it('should reject update by professeur (not admin)', async () => {
      const res = await authRequest.put(`/admin/disciplines/${disciplineId}`, professeurToken, {
        nom: 'Test'
      });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/disciplines/:id', () => {
    let emptyDisciplineId;
    let disciplineWithFiguresId;
    let adminUser;

    beforeAll(async () => {
      // Get admin user from seed data
      const adminResponse = await loginAs.admin();
      adminUser = adminResponse.user;

      // Create discipline without figures
      const emptyDiscipline = await Discipline.create({
        nom: 'Discipline Vide Test'
      });
      emptyDisciplineId = emptyDiscipline.id;

      // Create discipline with figures
      const disciplineWithFigures = await Discipline.create({
        nom: 'Discipline Avec Figures Test'
      });
      disciplineWithFiguresId = disciplineWithFigures.id;

      // Create a figure linked to this discipline
      await Figure.create({
        nom: 'Figure Test Protection',
        discipline_id: disciplineWithFiguresId,
        createur_id: adminUser.id,
        ecole_id: null
      });
    });

    it('should delete discipline without figures (master admin)', async () => {
      const res = await authRequest.delete(`/admin/disciplines/${emptyDisciplineId}`, adminToken);

      expect(res.status).toBe(200);
      expect(res.data.message).toContain('supprimée avec succès');

      // Verify it's gone
      const discipline = await Discipline.findByPk(emptyDisciplineId);
      expect(discipline).toBeNull();
    });

    it('should block deletion of discipline with linked figures (409 Conflict)', async () => {
      const res = await authRequest.delete(`/admin/disciplines/${disciplineWithFiguresId}`, adminToken);

      expect(res.status).toBe(409);
      expect(res.data.message).toContain('Impossible de supprimer');
      expect(res.data.details).toContain('figure(s)');
      expect(res.data.figuresCount).toBeGreaterThanOrEqual(1);

      // Verify it still exists
      const discipline = await Discipline.findByPk(disciplineWithFiguresId);
      expect(discipline).not.toBeNull();
    });

    it('should return 404 for non-existent discipline', async () => {
      const res = await authRequest.delete('/admin/disciplines/99999', adminToken);

      expect(res.status).toBe(404);
    });

    it('should reject deletion by professeur (not admin)', async () => {
      const res = await authRequest.delete(`/admin/disciplines/${disciplineId}`, professeurToken);

      expect(res.status).toBe(403);
    });
  });
});
