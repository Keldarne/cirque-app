const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('🎯 Gamification - Défis', () => {
  let eleveToken, adminToken;
  let eleveUser, adminUser;

  beforeAll(async () => {
    await waitForServer();

    ({ token: eleveToken, user: eleveUser } = await loginAs.user());
    ({ token: adminToken, user: adminUser } = await loginAs.admin());
  });

  describe('GET /api/gamification/defis - Liste défis disponibles', () => {
    test('✅ Utilisateur récupère liste défis', async () => {
      const res = await authRequest.get('/gamification/defis', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const defi = res.body[0];
        expect(defi).toHaveProperty('id');
        expect(defi).toHaveProperty('nom');
        expect(defi).toHaveProperty('description');
        expect(defi).toHaveProperty('type');
      }
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/gamification/defis', null);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gamification/defis/actifs - Défis actifs', () => {
    test('✅ Utilisateur récupère ses défis actifs', async () => {
      const res = await authRequest.get('/gamification/defis/actifs', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/gamification/defis/:defiId', () => {
    test('✅ Utilisateur récupère détails d\'un défi', async () => {
      const defisRes = await authRequest.get('/gamification/defis', eleveToken);

      if (defisRes.body.length > 0) {
        const defiId = defisRes.body[0].id;

        const res = await authRequest.get(`/gamification/defis/${defiId}`, eleveToken);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(defiId);
      }
    });

    test('❌ Défi inexistant retourne 404', async () => {
      const res = await authRequest.get('/gamification/defis/99999', eleveToken);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/gamification/defis/:defiId/accepter - Accepter défi', () => {
    test('✅ Utilisateur peut accepter un défi', async () => {
      const defisRes = await authRequest.get('/gamification/defis', eleveToken);

      if (defisRes.body.length > 0) {
        const defiId = defisRes.body[0].id;

        const res = await authRequest.post(
          `/gamification/defis/${defiId}/accepter`,
          eleveToken,
          {}
        );

        expect([200, 201, 409]).toContain(res.status); // 409 si déjà accepté
      }
    });

    test('❌ Défi inexistant retourne 404', async () => {
      const res = await authRequest.post(
        '/gamification/defis/99999/accepter',
        eleveToken,
        {}
      );

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/gamification/defis/:defiId/abandonner - Abandonner défi', () => {
    test('✅ Utilisateur peut abandonner un défi accepté', async () => {
      // Accept first
      const defisRes = await authRequest.get('/gamification/defis', eleveToken);

      if (defisRes.body.length > 0) {
        const defiId = defisRes.body[0].id;

        await authRequest.post(`/gamification/defis/${defiId}/accepter`, eleveToken, {});

        const res = await authRequest.post(
          `/gamification/defis/${defiId}/abandonner`,
          eleveToken,
          {}
        );

        expect([200, 404]).toContain(res.status);
      }
    });
  });

  describe('GET /api/gamification/defis/:defiId/progression - Progression défi', () => {
    test('✅ Utilisateur récupère progression d\'un défi', async () => {
      const defisRes = await authRequest.get('/gamification/defis/actifs', eleveToken);

      if (defisRes.body.length > 0) {
        const defiId = defisRes.body[0].id;

        const res = await authRequest.get(
          `/gamification/defis/${defiId}/progression`,
          eleveToken
        );

        expect([200, 404]).toContain(res.status);

        if (res.status === 200) {
          expect(res.body).toHaveProperty('defi_id');
          expect(res.body).toHaveProperty('progression');
          expect(res.body).toHaveProperty('complet');
        }
      }
    });
  });

  describe('POST /api/admin/gamification/defis - Créer défi (Admin)', () => {
    test('✅ Admin peut créer un défi', async () => {
      const res = await authRequest.post(
        '/admin/gamification/defis',
        adminToken,
        {
          nom: 'Défi Test',
          description: 'Description test',
          type: 'figure',
          critere: { figure_id: 1, repetitions: 5 },
          recompense_xp: 100
        }
      );

      expect([200, 201]).toContain(res.status);
    });

    test('❌ Utilisateur non-admin ne peut pas créer défi', async () => {
      const res = await authRequest.post(
        '/admin/gamification/defis',
        eleveToken,
        {
          nom: 'Défi Test',
          description: 'Test',
          type: 'figure'
        }
      );

      expect(res.status).toBe(403);
    });
  });
});
