const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');
const { Badge, BadgeUtilisateur } = require('../../../src/models');

describe('🏅 Gamification - Badges', () => {
  let eleveToken, adminToken;
  let eleveUser, adminUser;

  beforeAll(async () => {
    await waitForServer();

    ({ token: eleveToken, user: eleveUser } = await loginAs.user());
    ({ token: adminToken, user: adminUser } = await loginAs.admin());
  });

  describe('GET /api/gamification/badges - Liste badges disponibles', () => {
    test('✅ Utilisateur authentifié récupère liste badges', async () => {
      const res = await authRequest.get('/gamification/badges', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const badge = res.body[0];
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('nom');
        expect(badge).toHaveProperty('description');
        expect(badge).toHaveProperty('critere');
      }
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/gamification/badges', null);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gamification/badges/mes-badges - Badges utilisateur', () => {
    test('✅ Utilisateur récupère ses badges', async () => {
      const res = await authRequest.get('/gamification/badges/mes-badges', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const badgeUser = res.body[0];
        expect(badgeUser).toHaveProperty('badge_id');
        expect(badgeUser).toHaveProperty('date_obtention');
      }
    });

    test('✅ Nouvel utilisateur sans badges retourne liste vide', async () => {
      // Créer nouvel utilisateur
      const resNewUser = await authRequest.post('/register', adminToken, {
        pseudo: 'new_user_badges',
        email: 'newbadges@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const { token: newToken } = await loginAs.user('newbadges@test.com', 'Password123!');

      const res = await authRequest.get('/gamification/badges/mes-badges', newToken);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /api/gamification/badges/:badgeId', () => {
    test('✅ Utilisateur récupère détails d\'un badge', async () => {
      // Get first badge
      const badgesRes = await authRequest.get('/gamification/badges', eleveToken);

      if (badgesRes.body.length > 0) {
        const badgeId = badgesRes.body[0].id;

        const res = await authRequest.get(`/gamification/badges/${badgeId}`, eleveToken);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(badgeId);
        expect(res.body).toHaveProperty('nom');
        expect(res.body).toHaveProperty('description');
      }
    });

    test('❌ Badge inexistant retourne 404', async () => {
      const res = await authRequest.get('/gamification/badges/99999', eleveToken);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/gamification/badges/:badgeId/debloquer - Attribution manuelle (Admin)', () => {
    test('✅ Admin peut attribuer badge manuellement', async () => {
      const badgesRes = await authRequest.get('/gamification/badges', adminToken);

      if (badgesRes.body.length > 0) {
        const badgeId = badgesRes.body[0].id;

        const res = await authRequest.post(
          `/gamification/badges/${badgeId}/debloquer`,
          adminToken,
          { utilisateur_id: eleveUser.id }
        );

        expect([200, 201, 409]).toContain(res.status); // 409 si déjà possédé
      }
    });

    test('❌ Utilisateur non-admin ne peut pas attribuer badges', async () => {
      const badgesRes = await authRequest.get('/gamification/badges', eleveToken);

      if (badgesRes.body.length > 0) {
        const badgeId = badgesRes.body[0].id;

        const res = await authRequest.post(
          `/gamification/badges/${badgeId}/debloquer`,
          eleveToken,
          { utilisateur_id: eleveUser.id }
        );

        expect(res.status).toBe(403);
      }
    });
  });

  describe('GET /api/gamification/badges/progression/:disciplineId', () => {
    test('✅ Utilisateur récupère progression badges d\'une discipline', async () => {
      const res = await authRequest.get('/gamification/badges/progression/1', eleveToken);

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('total_badges');
        expect(res.body).toHaveProperty('badges_obtenus');
        expect(res.body).toHaveProperty('pourcentage');
      }
    });
  });
});
