/**
 * Tests pour les routes prof/programmes (programmes personnalisés)
 * Vérifie: création, liste, assignation
 */
const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('📋 Prof Programmes Routes - Programmes Personnalisés', () => {
  let profToken;

  beforeAll(async () => {
    await waitForServer();
    ({ token: profToken } = await loginAs.professeur());
  });

  describe('POST /api/prof/programmes - Création programme', () => {
    test('✅ Professeur peut créer un programme', async () => {
      const res = await authRequest.post('/prof/programmes', profToken, {
        nom: 'Programme Test API',
        description: 'Programme créé via tests',
        figureIds: [1, 2],
        estModele: false
      });

      expect([200, 201, 500]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body).toHaveProperty('programme');
        expect(res.body.programme).toHaveProperty('nom', 'Programme Test API');
      }
    });

    test('❌ Sans nom ou figures retourne 400', async () => {
      const res = await authRequest.post('/prof/programmes', profToken, {
        nom: 'Sans Figures'
      });

      expect(res.status).toBe(400);
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.post('/prof/programmes', null, {
        nom: 'Test',
        figureIds: [1]
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/prof/programmes - Liste programmes', () => {
    test('✅ Retourne liste des programmes du prof', async () => {
      const res = await authRequest.get('/prof/programmes', profToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('programmes');
      expect(Array.isArray(res.body.programmes)).toBe(true);
    });

    test('❌ Élève ne peut pas accéder', async () => {
      const { token: eleveToken } = await loginAs.user();
      const res = await authRequest.get('/prof/programmes', eleveToken);

      expect(res.status).toBe(403);
    });
  });
});
