/**
 * Tests pour les routes prof/groupes (gestion groupes de classe)
 * Vérifie: création, liste, ajout élèves
 */
const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('👥 Prof Groupes Routes - Gestion Groupes', () => {
  let profToken;

  beforeAll(async () => {
    await waitForServer();
    ({ token: profToken } = await loginAs.professeur());
  });

  describe('POST /api/prof/groupes - Création groupe', () => {
    test('✅ Professeur peut créer un groupe', async () => {
      const res = await authRequest.post('/prof/groupes', profToken, {
        nom: 'Test Groupe API',
        description: 'Groupe créé via tests',
        couleur: '#ff5722'
      });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('groupe');
      expect(res.body.groupe).toHaveProperty('nom', 'Test Groupe API');
    });

    test('❌ Sans nom retourne 400', async () => {
      const res = await authRequest.post('/prof/groupes', profToken, {
        description: 'Sans nom'
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('nom');
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.post('/prof/groupes', null, {
        nom: 'Test'
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/prof/groupes - Liste groupes', () => {
    test('✅ Retourne liste des groupes du prof', async () => {
      const res = await authRequest.get('/prof/groupes', profToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.groupes)).toBe(true);
    });

    test('❌ Élève ne peut pas accéder', async () => {
      const { token: eleveToken } = await loginAs.user();
      const res = await authRequest.get('/prof/groupes', eleveToken);

      expect(res.status).toBe(403);
    });
  });
});
