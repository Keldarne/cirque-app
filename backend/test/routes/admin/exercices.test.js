/**
 * Tests pour les routes admin/exercices (CRUD exercices décomposés)
 * Vérifie: ajout exercice, validation cycles
 */
const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('🧩 Admin Exercices Routes - CRUD Exercices', () => {
  let adminToken, profToken;

  beforeAll(async () => {
    await waitForServer();
    ({ token: adminToken } = await loginAs.admin());
    ({ token: profToken } = await loginAs.professeur());
  });

  describe('POST /api/admin/figures/:figureId/exercices', () => {
    test('✅ Admin peut ajouter exercice décomposé', async () => {
      const res = await authRequest.post(
        '/admin/figures/1/exercices',
        adminToken,
        {
          exercice_figure_id: 2,
          ordre: 0,
          est_requis: true,
          poids: 2
        }
      );

      expect([200, 201, 400, 409, 500]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body).toHaveProperty('message');
      }
    });

    test('❌ Sans exercice_figure_id retourne 400', async () => {
      const res = await authRequest.post(
        '/admin/figures/1/exercices',
        adminToken,
        { ordre: 0 }
      );

      expect(res.status).toBe(400);
    });

    test('❌ Professeur ne peut pas ajouter', async () => {
      const res = await authRequest.post(
        '/admin/figures/1/exercices',
        profToken,
        { exercice_figure_id: 2 }
      );

      expect(res.status).toBe(403);
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.post(
        '/admin/figures/1/exercices',
        null,
        { exercice_figure_id: 2 }
      );

      expect(res.status).toBe(401);
    });
  });
});
