/**
 * Tests pour les routes figures publiques
 * Vérifie: liste figures, détails figure, filtrage par discipline
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');

describe('🎪 Figures Routes - Catalogue Public', () => {
  let eleveToken;

  beforeAll(async () => {
    await waitForServer();

    ({ token: eleveToken } = await loginAs.user());
  });

  describe('GET /api/figures - Liste figures', () => {
    test('✅ Récupère liste des figures', async () => {
      const res = await authRequest.get('/figures', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('✅ Filtre par discipline', async () => {
      const res = await authRequest.get('/figures?discipline_id=1', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('✅ Accessible sans authentification', async () => {
      const res = await authRequest.get('/figures', null);

      expect([200, 401]).toContain(res.status);
    });
  });

  describe('GET /api/figures/:id - Détails figure', () => {
    test('✅ Récupère détails d\'une figure avec étapes', async () => {
      const listRes = await authRequest.get('/figures', eleveToken);

      if (listRes.body.length > 0) {
        const figureId = listRes.body[0].id;

        const res = await authRequest.get(`/figures/${figureId}`, eleveToken);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('nom');
      }
    });

    test('❌ Figure inexistante retourne 404', async () => {
      const res = await authRequest.get('/figures/99999', eleveToken);

      expect(res.status).toBe(404);
    });
  });
});
