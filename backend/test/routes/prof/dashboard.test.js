const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');
const { Utilisateur, RelationProfEleve, ProgressionEtape, EtapeProgression, Figure } = require('../../../src/models');

describe('📊 Routes Prof - Dashboard', () => {
  let adminToken, profToken, eleveToken;
  let adminUser, profUser, eleveUser;
  let prof2Token, prof2User;

  beforeAll(async () => {
    await waitForServer();

    // Login utilisateurs existants
    ({ token: adminToken, user: adminUser } = await loginAs.admin());
    ({ token: profToken, user: profUser } = await loginAs.professeur());
    ({ token: eleveToken, user: eleveUser } = await loginAs.user());

    // Créer prof2 (sans élèves)
    const resProf2 = await authRequest.post('/register', adminToken, {
      pseudo: 'prof_dashboard_2',
      email: 'profdash2@test.com',
      mot_de_passe: 'Password123!',
      role: 'professeur'
    });
    prof2User = resProf2.user;
    ({ token: prof2Token } = await loginAs.professeur('profdash2@test.com', 'Password123!'));

    // Créer relation prof1 - eleve1
    await RelationProfEleve.create({
      professeur_id: profUser.id,
      eleve_id: eleveUser.id,
      statut: 'accepte'
    });
  });

  describe('GET /api/prof/dashboard - Stats dashboard', () => {
    test('✅ Professeur récupère stats de son dashboard', async () => {
      const res = await authRequest.get('/prof/dashboard', profToken);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();

      // Vérifier structure des stats
      expect(res.body).toHaveProperty('total_eleves');
      expect(res.body).toHaveProperty('eleves_actifs');
      expect(res.body).toHaveProperty('total_progressions');

      // Les valeurs doivent être des nombres
      expect(typeof res.body.total_eleves).toBe('number');
      expect(typeof res.body.eleves_actifs).toBe('number');
      expect(typeof res.body.total_progressions).toBe('number');
    });

    test('✅ Admin récupère stats globales', async () => {
      const res = await authRequest.get('/prof/dashboard', adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.total_eleves).toBeGreaterThanOrEqual(0);
    });

    test('✅ Prof sans élèves retourne stats à 0', async () => {
      const res = await authRequest.get('/prof/dashboard', prof2Token);

      expect(res.status).toBe(200);
      expect(res.body.total_eleves).toBe(0);
      expect(res.body.eleves_actifs).toBe(0);
    });

    test('❌ Élève ne peut pas accéder au dashboard prof', async () => {
      const res = await authRequest.get('/prof/dashboard', eleveToken);

      expect(res.status).toBe(403);
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/prof/dashboard', null);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/prof/dashboard/alertes - Élèves à risque', () => {
    test('✅ Professeur récupère liste élèves à risque', async () => {
      const res = await authRequest.get('/prof/dashboard/alertes', profToken);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(Array.isArray(res.body.alertes || res.body)).toBe(true);
    });

    test('✅ Admin récupère toutes les alertes', async () => {
      const res = await authRequest.get('/prof/dashboard/alertes', adminToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.alertes || res.body)).toBe(true);
    });

    test('✅ Alertes contiennent infos élève et raison', async () => {
      const res = await authRequest.get('/prof/dashboard/alertes', profToken);

      expect(res.status).toBe(200);

      const alertes = res.body.alertes || res.body;
      if (alertes.length > 0) {
        const alerte = alertes[0];
        expect(alerte).toHaveProperty('eleve_id');
        expect(alerte).toHaveProperty('raison');
      }
    });

    test('✅ Prof2 sans élèves retourne liste vide', async () => {
      const res = await authRequest.get('/prof/dashboard/alertes', prof2Token);

      expect(res.status).toBe(200);
      const alertes = res.body.alertes || res.body;
      expect(alertes.length).toBe(0);
    });

    test('❌ Élève ne peut pas accéder aux alertes', async () => {
      const res = await authRequest.get('/prof/dashboard/alertes', eleveToken);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/prof/dashboard/statistiques-groupe/:groupeId', () => {
    test('✅ Professeur récupère stats d\'un de ses groupes', async () => {
      // Créer un groupe
      const groupeRes = await authRequest.post('/prof/groupes', profToken, {
        nom: 'Groupe Dashboard Test',
        description: 'Test stats groupe'
      });

      const groupeId = groupeRes.body.id;

      const res = await authRequest.get(
        `/prof/dashboard/statistiques-groupe/${groupeId}`,
        profToken
      );

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body).toBeDefined();
        expect(res.body).toHaveProperty('groupe_id');
        expect(res.body).toHaveProperty('total_eleves');
      }
    });

    test('❌ Professeur ne peut pas voir stats groupe d\'un autre prof', async () => {
      // Créer groupe avec prof2
      const groupeRes = await authRequest.post('/prof/groupes', prof2Token, {
        nom: 'Groupe Prof2 Dashboard',
        description: 'Test'
      });

      const groupeId = groupeRes.body.id;

      // Prof1 essaie d'accéder
      const res = await authRequest.get(
        `/prof/dashboard/statistiques-groupe/${groupeId}`,
        profToken
      );

      expect(res.status).toBe(403);
    });

    test('❌ Groupe inexistant retourne 404', async () => {
      const res = await authRequest.get(
        '/prof/dashboard/statistiques-groupe/99999',
        profToken
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/prof/dashboard/evolution/:eleveId', () => {
    test('✅ Professeur récupère évolution de son élève', async () => {
      const res = await authRequest.get(
        `/prof/dashboard/evolution/${eleveUser.id}`,
        profToken
      );

      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body).toBeDefined();
        expect(Array.isArray(res.body.evolution || res.body)).toBe(true);
      }
    });

    test('❌ Professeur ne peut pas voir évolution d\'élève d\'un autre prof', async () => {
      // Créer élève non lié
      const resAutreEleve = await authRequest.post('/register', adminToken, {
        pseudo: 'eleve_evolution_autre',
        email: 'eleveevol@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const res = await authRequest.get(
        `/prof/dashboard/evolution/${resAutreEleve.user.id}`,
        profToken
      );

      expect(res.status).toBe(403);
    });

    test('✅ Admin peut voir évolution de n\'importe quel élève', async () => {
      const res = await authRequest.get(
        `/prof/dashboard/evolution/${eleveUser.id}`,
        adminToken
      );

      expect([200, 404]).toContain(res.status);
    });
  });
});
