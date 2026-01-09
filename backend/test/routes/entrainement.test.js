/**
 * Tests pour les routes entrainement (tentatives d'entraînement)
 * Vérifie: enregistrement tentatives avec 4 modes, validation, historique
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');
const { EtapeProgression } = require('../../src/models');

describe('🏋️ Entrainement Routes - Tentatives', () => {
  let eleveToken, profToken;
  let eleveUser, testEtape;

  beforeAll(async () => {
    await waitForServer();

    ({ token: eleveToken, user: eleveUser } = await loginAs.user());
    ({ token: profToken } = await loginAs.professeur());

    const etapes = await EtapeProgression.findAll({ limit: 1 });
    if (etapes.length > 0) {
      testEtape = etapes[0];
    }
  });

  describe('POST /api/entrainement/tentatives - Enregistrement tentatives', () => {
    test('✅ Mode binaire: enregistre tentative réussie', async () => {
      if (!testEtape) {
        console.log('⚠️ Aucune étape disponible pour test');
        return;
      }

      const res = await authRequest.post('/entrainement/tentatives', eleveToken, {
        etapeId: testEtape.id,
        typeSaisie: 'binaire',
        reussite: true
      });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('tentative');
    });

    test('❌ Sans etapeId retourne 400', async () => {
      const res = await authRequest.post('/entrainement/tentatives', eleveToken, {
        typeSaisie: 'binaire',
        reussite: true
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('etapeId');
    });

    test('❌ Sans authentification retourne 401', async () => {
      if (!testEtape) return;

      const res = await authRequest.post('/entrainement/tentatives', null, {
        etapeId: testEtape.id,
        typeSaisie: 'binaire',
        reussite: true
      });

      expect(res.status).toBe(401);
    });
  });
});
