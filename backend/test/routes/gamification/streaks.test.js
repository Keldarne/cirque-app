const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');

describe('🔥 Gamification - Streaks', () => {
  let eleveToken, adminToken;
  let eleveUser, adminUser;

  beforeAll(async () => {
    await waitForServer();

    ({ token: eleveToken, user: eleveUser } = await loginAs.user());
    ({ token: adminToken, user: adminUser } = await loginAs.admin());
  });

  describe('GET /api/gamification/streaks/actuelle - Streak actuelle', () => {
    test('✅ Utilisateur récupère sa streak actuelle', async () => {
      const res = await authRequest.get('/gamification/streaks/actuelle', eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('jours_consecutifs');
      expect(res.body).toHaveProperty('derniere_activite');
      expect(typeof res.body.jours_consecutifs).toBe('number');
    });

    test('✅ Nouvel utilisateur a streak 0', async () => {
      const resNewUser = await authRequest.post('/register', adminToken, {
        pseudo: 'new_user_streak',
        email: 'newstreak@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const { token: newToken } = await loginAs.user('newstreak@test.com', 'Password123!');

      const res = await authRequest.get('/gamification/streaks/actuelle', newToken);

      expect(res.status).toBe(200);
      expect(res.body.jours_consecutifs).toBe(0);
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/gamification/streaks/actuelle', null);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gamification/streaks/historique - Historique streaks', () => {
    test('✅ Utilisateur récupère historique de ses streaks', async () => {
      const res = await authRequest.get('/gamification/streaks/historique', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const streak = res.body[0];
        expect(streak).toHaveProperty('date_debut');
        expect(streak).toHaveProperty('date_fin');
        expect(streak).toHaveProperty('duree_jours');
      }
    });

    test('✅ Nouvel utilisateur retourne historique vide', async () => {
      const resNewUser = await authRequest.post('/register', adminToken, {
        pseudo: 'new_user_streak_hist',
        email: 'newstreakhist@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const { token: newToken } = await loginAs.user('newstreakhist@test.com', 'Password123!');

      const res = await authRequest.get('/gamification/streaks/historique', newToken);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /api/gamification/streaks/meilleure - Meilleure streak', () => {
    test('✅ Utilisateur récupère sa meilleure streak', async () => {
      const res = await authRequest.get('/gamification/streaks/meilleure', eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('duree_max');
      expect(typeof res.body.duree_max).toBe('number');
    });

    test('✅ Nouvel utilisateur a meilleure streak 0', async () => {
      const resNewUser = await authRequest.post('/register', adminToken, {
        pseudo: 'new_user_best_streak',
        email: 'newbeststreak@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const { token: newToken } = await loginAs.user('newbeststreak@test.com', 'Password123!');

      const res = await authRequest.get('/gamification/streaks/meilleure', newToken);

      expect(res.status).toBe(200);
      expect(res.body.duree_max).toBe(0);
    });
  });

  describe('GET /api/gamification/streaks/statistiques - Stats streaks', () => {
    test('✅ Utilisateur récupère statistiques de streaks', async () => {
      const res = await authRequest.get('/gamification/streaks/statistiques', eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('streak_actuelle');
      expect(res.body).toHaveProperty('meilleure_streak');
      expect(res.body).toHaveProperty('total_streaks');
      expect(res.body).toHaveProperty('moyenne_duree');
    });
  });

  describe('GET /api/gamification/streaks/calendrier - Calendrier activité', () => {
    test('✅ Utilisateur récupère calendrier d\'activité', async () => {
      const res = await authRequest.get(
        '/gamification/streaks/calendrier?mois=2026-01',
        eleveToken
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const jour = res.body[0];
        expect(jour).toHaveProperty('date');
        expect(jour).toHaveProperty('actif');
      }
    });

    test('✅ Calendrier sans mois retourne mois courant', async () => {
      const res = await authRequest.get('/gamification/streaks/calendrier', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/gamification/streaks/classement - Classement streaks', () => {
    test('✅ Utilisateur récupère classement des streaks', async () => {
      const res = await authRequest.get('/gamification/streaks/classement', eleveToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        const classement = res.body[0];
        expect(classement).toHaveProperty('utilisateur_id');
        expect(classement).toHaveProperty('jours_consecutifs');
        expect(classement).toHaveProperty('rang');
      }
    });

    test('✅ Classement trié par streak décroissante', async () => {
      const res = await authRequest.get('/gamification/streaks/classement', eleveToken);

      expect(res.status).toBe(200);

      if (res.body.length > 1) {
        for (let i = 0; i < res.body.length - 1; i++) {
          expect(res.body[i].jours_consecutifs)
            .toBeGreaterThanOrEqual(res.body[i + 1].jours_consecutifs);
        }
      }
    });
  });

  describe('POST /api/gamification/streaks/notification - Rappel streak', () => {
    test('✅ Utilisateur peut activer notification de rappel', async () => {
      const res = await authRequest.post(
        '/gamification/streaks/notification',
        eleveToken,
        { activer: true, heure: '20:00' }
      );

      expect([200, 201, 204]).toContain(res.status);
    });

    test('✅ Utilisateur peut désactiver notification', async () => {
      const res = await authRequest.post(
        '/gamification/streaks/notification',
        eleveToken,
        { activer: false }
      );

      expect([200, 204]).toContain(res.status);
    });
  });
});
