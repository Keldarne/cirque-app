/**
 * Tests pour les routes statistiques utilisateur
 * Vérifie: récupération stats personnelles, radar polyvalence, latéralité
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');

describe('📊 Statistiques Routes - Stats Utilisateur', () => {
  let eleveToken, profToken;
  let eleveUser;

  beforeAll(async () => {
    await waitForServer();

    ({ token: eleveToken, user: eleveUser } = await loginAs.user());
    ({ token: profToken } = await loginAs.professeur());
  });

  describe('GET /api/statistiques/progression - Stats progression', () => {
    test('✅ Utilisateur récupère ses stats de progression', async () => {
      const res = await authRequest.get('/statistiques/progression', eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('figures_validees');
      expect(res.body).toHaveProperty('etapes_validees');
      expect(res.body).toHaveProperty('xp_total');
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/statistiques/progression', null);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/statistiques/radar - Radar polyvalence', () => {
    test('✅ Retourne radar des disciplines', async () => {
      const res = await authRequest.get('/statistiques/radar', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/statistiques/lateralite - Stats latéralité', () => {
    test('✅ Retourne analyse latéralité', async () => {
      const res = await authRequest.get('/statistiques/lateralite', eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stats');
      expect(res.body).toHaveProperty('desequilibre');
    });
  });

  describe('GET /api/statistiques/memory-decay - Stats déclin mémoriel', () => {
    test('✅ Retourne stats memory decay', async () => {
      const res = await authRequest.get('/statistiques/memory-decay', eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('fresh');
      expect(res.body).toHaveProperty('fragile');
      expect(res.body).toHaveProperty('stale');
      expect(res.body).toHaveProperty('forgotten');
    });
  });
});
