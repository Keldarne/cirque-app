const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('👑 Gamification - Titres', () => {
  let eleveToken, adminToken;
  let eleveUser, adminUser;

  beforeAll(async () => {
    await waitForServer();

    ({ token: eleveToken, user: eleveUser } = await loginAs.user());
    ({ token: adminToken, user: adminUser } = await loginAs.admin());
  });

  describe('GET /api/gamification/titres - Liste titres disponibles', () => {
    test('✅ Utilisateur récupère liste titres', async () => {
      const res = await authRequest.get('/gamification/titres', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const titre = res.body[0];
        expect(titre).toHaveProperty('id');
        expect(titre).toHaveProperty('nom');
        expect(titre).toHaveProperty('description');
        expect(titre).toHaveProperty('niveau_requis');
      }
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/gamification/titres', null);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gamification/titres/mes-titres - Titres utilisateur', () => {
    test('✅ Utilisateur récupère ses titres débloqués', async () => {
      const res = await authRequest.get('/gamification/titres/mes-titres', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const titreUser = res.body[0];
        expect(titreUser).toHaveProperty('titre_id');
        expect(titreUser).toHaveProperty('date_obtention');
      }
    });

    test('✅ Nouvel utilisateur sans titres retourne liste vide', async () => {
      const resNewUser = await authRequest.post('/register', adminToken, {
        pseudo: 'new_user_titres',
        email: 'newtitres@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const { token: newToken } = await loginAs.user('newtitres@test.com', 'Password123!');

      const res = await authRequest.get('/gamification/titres/mes-titres', newToken);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /api/gamification/titres/:titreId', () => {
    test('✅ Utilisateur récupère détails d\'un titre', async () => {
      const titresRes = await authRequest.get('/gamification/titres', eleveToken);

      if (titresRes.body.length > 0) {
        const titreId = titresRes.body[0].id;

        const res = await authRequest.get(`/gamification/titres/${titreId}`, eleveToken);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(titreId);
        expect(res.body).toHaveProperty('nom');
        expect(res.body).toHaveProperty('description');
      }
    });

    test('❌ Titre inexistant retourne 404', async () => {
      const res = await authRequest.get('/gamification/titres/99999', eleveToken);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/gamification/titres/actif/:titreId - Changer titre actif', () => {
    test('✅ Utilisateur peut changer son titre actif', async () => {
      const titresRes = await authRequest.get('/gamification/titres/mes-titres', eleveToken);

      if (titresRes.body.length > 0) {
        const titreId = titresRes.body[0].titre_id;

        const res = await authRequest.put(
          `/gamification/titres/actif/${titreId}`,
          eleveToken,
          {}
        );

        expect([200, 204]).toContain(res.status);
      }
    });

    test('❌ Utilisateur ne peut pas activer titre non possédé', async () => {
      const res = await authRequest.put(
        '/gamification/titres/actif/99999',
        eleveToken,
        {}
      );

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('GET /api/gamification/titres/disponibles - Titres déblocables', () => {
    test('✅ Utilisateur récupère titres à sa portée', async () => {
      const res = await authRequest.get(
        '/gamification/titres/disponibles',
        eleveToken
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const titre = res.body[0];
        expect(titre).toHaveProperty('niveau_requis');
        expect(titre).toHaveProperty('progression_actuelle');
      }
    });
  });

  describe('POST /api/admin/gamification/titres - Créer titre (Admin)', () => {
    test('✅ Admin peut créer un titre', async () => {
      const res = await authRequest.post(
        '/admin/gamification/titres',
        adminToken,
        {
          nom: 'Titre Test',
          description: 'Description test',
          niveau_requis: 5,
          icone: 'test_icon'
        }
      );

      expect([200, 201]).toContain(res.status);
    });

    test('❌ Utilisateur non-admin ne peut pas créer titre', async () => {
      const res = await authRequest.post(
        '/admin/gamification/titres',
        eleveToken,
        {
          nom: 'Titre Test',
          description: 'Test'
        }
      );

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/gamification/titres/:titreId - Supprimer titre (Admin)', () => {
    test('✅ Admin peut supprimer un titre', async () => {
      // Create first
      const createRes = await authRequest.post(
        '/admin/gamification/titres',
        adminToken,
        {
          nom: 'Titre à Supprimer',
          description: 'Test',
          niveau_requis: 1
        }
      );

      if (createRes.status === 200 || createRes.status === 201) {
        const titreId = createRes.body.id;

        const res = await authRequest.delete(
          `/admin/gamification/titres/${titreId}`,
          adminToken
        );

        expect([200, 204]).toContain(res.status);
      }
    });

    test('❌ Utilisateur non-admin ne peut pas supprimer titre', async () => {
      const res = await authRequest.delete(
        '/admin/gamification/titres/1',
        eleveToken
      );

      expect(res.status).toBe(403);
    });
  });
});
