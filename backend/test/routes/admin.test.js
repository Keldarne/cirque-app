/**
 * Tests pour les routes admin (CRUD figures globales)
 * Vérifie: création/modification/suppression figures, permissions admin
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');

describe('🔧 Admin Routes - Gestion Figures', () => {
  let adminToken, profToken, eleveToken;

  beforeAll(async () => {
    await waitForServer();

    ({ token: adminToken } = await loginAs.admin());
    ({ token: profToken } = await loginAs.professeur());
    ({ token: eleveToken } = await loginAs.user());
  });

  describe('POST /api/admin/figures - Création figure', () => {
    test('✅ Admin peut créer une figure', async () => {
      const res = await authRequest.post('/admin/figures', adminToken, {
        nom: 'Test Figure Admin',
        discipline_id: 1,
        difficulty_level: 2,
        type: 'artistique'
      });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
    });

    test('❌ Professeur ne peut pas créer figure globale', async () => {
      const res = await authRequest.post('/admin/figures', profToken, {
        nom: 'Test Figure Prof',
        discipline_id: 1
      });

      expect(res.status).toBe(403);
    });

    test('❌ Élève ne peut pas créer figure', async () => {
      const res = await authRequest.post('/admin/figures', eleveToken, {
        nom: 'Test Figure Eleve',
        discipline_id: 1
      });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/figures - Liste figures', () => {
    test('✅ Admin récupère toutes les figures', async () => {
      const res = await authRequest.get('/admin/figures', adminToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PUT /api/admin/figures/:id - Modification figure', () => {
    test('✅ Admin peut modifier une figure', async () => {
      const createRes = await authRequest.post('/admin/figures', adminToken, {
        nom: 'Figure Modifiable',
        discipline_id: 1
      });

      if (createRes.status === 201 || createRes.status === 200) {
        const figureId = createRes.body.id;

        const res = await authRequest.put(`/admin/figures/${figureId}`, adminToken, {
          nom: 'Figure Modifiée'
        });

        expect([200, 204]).toContain(res.status);
      }
    });
  });

  describe('DELETE /api/admin/figures/:id - Suppression figure', () => {
    test('✅ Admin peut supprimer une figure', async () => {
      const createRes = await authRequest.post('/admin/figures', adminToken, {
        nom: 'Figure Supprimable',
        discipline_id: 1
      });

      if (createRes.status === 201 || createRes.status === 200) {
        const figureId = createRes.body.id;

        const res = await authRequest.delete(`/admin/figures/${figureId}`, adminToken);

        expect([200, 204]).toContain(res.status);
      }
    });

    test('❌ Non-admin ne peut pas supprimer', async () => {
      const res = await authRequest.delete('/admin/figures/1', profToken);

      expect(res.status).toBe(403);
    });
  });
});
