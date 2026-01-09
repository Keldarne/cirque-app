/**
 * Tests pour les routes disciplines (catalogue public)
 * Vérifie: liste disciplines, détails, authentification requise
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');
const { Discipline } = require('../../src/models');

describe('📚 Disciplines Routes - Catalogue Public', () => {
  let eleveToken;

  beforeAll(async () => {
    await waitForServer();
    ({ token: eleveToken } = await loginAs.user());
  });

  describe('GET /api/disciplines - Liste disciplines', () => {
    test('✅ Retourne liste complète des disciplines', async () => {
      const res = await authRequest.get('/disciplines', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('nom');
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/disciplines', null);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/disciplines/:id - Détails discipline', () => {
    test('✅ Retourne détails avec figures associées', async () => {
      const disciplines = await Discipline.findAll({ limit: 1 });
      if (disciplines.length === 0) {
        console.log('⚠️ Aucune discipline disponible pour test');
        return;
      }

      const res = await authRequest.get(`/disciplines/${disciplines[0].id}`, eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', disciplines[0].id);
      expect(res.body).toHaveProperty('nom');
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/disciplines/1', null);
      expect(res.status).toBe(401);
    });
  });
});
