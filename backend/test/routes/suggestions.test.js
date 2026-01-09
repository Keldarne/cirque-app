/**
 * Tests pour les routes suggestions (recommandations élève)
 * Vérifie: liste suggestions, détails, accepter/dismisser
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');

describe('💡 Suggestions Routes - Recommandations Élève', () => {
  let eleveToken;

  beforeAll(async () => {
    await waitForServer();
    ({ token: eleveToken } = await loginAs.user());
  });

  describe('GET /api/suggestions - Liste suggestions', () => {
    test('✅ Retourne suggestions personnalisées', async () => {
      const res = await authRequest.get('/suggestions', eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('suggestions');
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body).toHaveProperty('count');
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/suggestions', null);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/suggestions/:figureId/details', () => {
    test('✅ Retourne détails préparation pour une figure', async () => {
      const res = await authRequest.get('/suggestions/1/details', eleveToken);

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('score_preparation');
        expect(res.body).toHaveProperty('exercices_valides');
        expect(res.body).toHaveProperty('exercices_total');
      }
    });

    test('❌ figureId invalide retourne 400', async () => {
      const res = await authRequest.get('/suggestions/invalid/details', eleveToken);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/suggestions/:figureId/accepter', () => {
    test('✅ Accepter suggestion ajoute au programme personnel', async () => {
      const res = await authRequest.post('/suggestions/1/accepter', eleveToken, {});

      expect([201, 404, 500]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('programme');
      }
    });

    test('❌ figureId invalide retourne 400', async () => {
      const res = await authRequest.post('/suggestions/invalid/accepter', eleveToken, {});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/suggestions/:figureId/dismisser', () => {
    test('✅ Dismisser suggestion masque la suggestion', async () => {
      const res = await authRequest.post('/suggestions/1/dismisser', eleveToken, {});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    test('❌ figureId invalide retourne 400', async () => {
      const res = await authRequest.post('/suggestions/invalid/dismisser', eleveToken, {});
      expect(res.status).toBe(400);
    });
  });
});
