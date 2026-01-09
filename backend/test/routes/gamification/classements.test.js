/**
 * Tests pour les routes gamification/classements (leaderboards)
 * Vérifie: classements global, hebdo, groupe
 */
const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('🏆 Gamification Classements Routes - Leaderboards', () => {
  let eleveToken;

  beforeAll(async () => {
    await waitForServer();
    ({ token: eleveToken } = await loginAs.user());
  });

  describe('GET /api/gamification/classements/global', () => {
    test('✅ Retourne classement global XP', async () => {
      const res = await authRequest.get(
        '/gamification/classements/global',
        eleveToken
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('leaderboard');
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/gamification/classements/global', null);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gamification/classements/hebdomadaire', () => {
    test('✅ Retourne classement hebdomadaire', async () => {
      const res = await authRequest.get(
        '/gamification/classements/hebdomadaire',
        eleveToken
      );

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/gamification/classements/groupe/:id', () => {
    test('✅ Retourne classement du groupe', async () => {
      const res = await authRequest.get(
        '/gamification/classements/groupe/1',
        eleveToken
      );

      expect([200, 403, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('groupe');
        expect(res.body).toHaveProperty('classement');
      }
    });
  });
});
