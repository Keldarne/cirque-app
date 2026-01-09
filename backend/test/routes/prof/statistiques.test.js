/**
 * Tests pour les routes prof/statistiques (stats prof)
 * Vérifie: statistiques globales, élèves actifs
 */
const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('📊 Prof Statistiques Routes - Stats Professeur', () => {
  let profToken;

  beforeAll(async () => {
    await waitForServer();
    ({ token: profToken } = await loginAs.professeur());
  });

  describe('GET /api/prof/statistiques - Stats globales', () => {
    test('✅ Retourne statistiques du prof', async () => {
      const res = await authRequest.get('/prof/statistiques', profToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalEleves');
      expect(res.body).toHaveProperty('totalGroupes');
      expect(res.body).toHaveProperty('elevesActifs');
    });

    test('❌ Élève ne peut pas accéder', async () => {
      const { token: eleveToken } = await loginAs.user();
      const res = await authRequest.get('/prof/statistiques', eleveToken);

      expect(res.status).toBe(403);
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/prof/statistiques', null);
      expect(res.status).toBe(401);
    });
  });
});
