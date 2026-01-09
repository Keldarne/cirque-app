/**
 * Tests pour les routes gamification/statistiques (profil gamification)
 * Vérifie: profil complet gamification
 */
const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('📈 Gamification Statistiques Routes - Profil', () => {
  let eleveToken;

  beforeAll(async () => {
    await waitForServer();
    ({ token: eleveToken } = await loginAs.user());
  });

  describe('GET /api/gamification/statistiques/utilisateur/profil-gamification', () => {
    test('✅ Retourne profil gamification complet', async () => {
      const res = await authRequest.get(
        '/gamification/statistiques/utilisateur/profil-gamification',
        eleveToken
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profil');
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get(
        '/gamification/statistiques/utilisateur/profil-gamification',
        null
      );

      expect(res.status).toBe(401);
    });
  });
});
