/**
 * Tests pour les routes progression (gestion progression utilisateur)
 * Vérifie: consultation progression, permissions prof/élève
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');

describe('📈 Progression Routes - Gestion Progression', () => {
  let eleveToken, profToken;
  let eleveUser;

  beforeAll(async () => {
    await waitForServer();
    ({ token: eleveToken, user: eleveUser } = await loginAs.user());
    ({ token: profToken } = await loginAs.professeur());
  });

  describe('GET /api/progression/utilisateur/:utilisateurId', () => {
    test('✅ Élève peut consulter sa propre progression', async () => {
      const res = await authRequest.get(
        `/progression/utilisateur/${eleveUser.id}`,
        eleveToken
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('✅ Professeur peut consulter progression élève même école', async () => {
      const res = await authRequest.get(
        `/progression/utilisateur/${eleveUser.id}`,
        profToken
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('❌ Élève ne peut pas consulter progression autre élève', async () => {
      const autreEleveId = eleveUser.id + 1;
      const res = await authRequest.get(
        `/progression/utilisateur/${autreEleveId}`,
        eleveToken
      );

      expect(res.status).toBe(403);
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get(
        `/progression/utilisateur/${eleveUser.id}`,
        null
      );

      expect(res.status).toBe(401);
    });
  });
});
