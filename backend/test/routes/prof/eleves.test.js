const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');
const { Utilisateur, RelationProfEleve } = require('../../../src/models');

describe('🧑‍🎓 Routes Prof - Élèves', () => {
  let adminToken, profToken, eleve1Token, eleve2Token;
  let adminUser, profUser, eleve1User, eleve2User;
  let prof2Token, prof2User;

  beforeAll(async () => {
    await waitForServer();

    // Login utilisateurs existants du seed
    ({ token: adminToken, user: adminUser } = await loginAs.admin());
    ({ token: profToken, user: profUser } = await loginAs.professeur());
    ({ token: eleve1Token, user: eleve1User } = await loginAs.user());

    // Créer élève 2
    const resEleve2 = await authRequest.post('/register', adminToken, {
      pseudo: 'eleve_test_2',
      email: 'eleve2@test.com',
      mot_de_passe: 'Password123!',
      role: 'eleve'
    });
    eleve2User = resEleve2.user;
    ({ token: eleve2Token } = await loginAs.user('eleve2@test.com', 'Password123!'));

    // Créer prof 2 (sans élèves)
    const resProf2 = await authRequest.post('/register', adminToken, {
      pseudo: 'prof_test_2',
      email: 'prof2@test.com',
      mot_de_passe: 'Password123!',
      role: 'professeur'
    });
    prof2User = resProf2.user;
    ({ token: prof2Token } = await loginAs.professeur('prof2@test.com', 'Password123!'));

    // Créer relation prof1 - eleve1
    await RelationProfEleve.create({
      professeur_id: profUser.id,
      eleve_id: eleve1User.id,
      statut: 'accepte'
    });

    // Créer relation prof1 - eleve2
    await RelationProfEleve.create({
      professeur_id: profUser.id,
      eleve_id: eleve2User.id,
      statut: 'accepte'
    });
  });

  describe('GET /api/prof/eleves - Liste élèves', () => {
    test('✅ Professeur récupère ses élèves', async () => {
      const res = await authRequest.get('/prof/eleves', profToken);

      expect(res.status).toBe(200);
      expect(res.body.eleves).toBeDefined();
      expect(Array.isArray(res.body.eleves)).toBe(true);
      expect(res.body.eleves.length).toBeGreaterThanOrEqual(2);

      // Vérifier que les élèves retournés sont liés au prof
      const eleveIds = res.body.eleves.map(e => e.id);
      expect(eleveIds).toContain(eleve1User.id);
      expect(eleveIds).toContain(eleve2User.id);
    });

    test('✅ Admin récupère tous les élèves', async () => {
      const res = await authRequest.get('/prof/eleves', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.eleves).toBeDefined();
      expect(Array.isArray(res.body.eleves)).toBe(true);
    });

    test('✅ Prof2 (sans élèves) retourne liste vide', async () => {
      const res = await authRequest.get('/prof/eleves', prof2Token);

      expect(res.status).toBe(200);
      expect(res.body.eleves).toBeDefined();
      expect(res.body.eleves.length).toBe(0);
    });

    test('❌ Élève ne peut pas accéder à cette route', async () => {
      const res = await authRequest.get('/prof/eleves', eleve1Token);

      expect(res.status).toBe(403);
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/prof/eleves', null);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/prof/eleves/:id - Détails élève', () => {
    test('✅ Professeur récupère détails de son élève', async () => {
      const res = await authRequest.get(`/prof/eleves/${eleve1User.id}`, profToken);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(eleve1User.id);
      expect(res.body.pseudo).toBeDefined();
      expect(res.body.email).toBeDefined();
    });

    test('✅ Admin récupère détails de n\'importe quel élève', async () => {
      const res = await authRequest.get(`/prof/eleves/${eleve1User.id}`, adminToken);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(eleve1User.id);
    });

    test('❌ Professeur ne peut pas voir élève d\'un autre prof', async () => {
      // Créer un élève non lié à prof1
      const resEleveAutre = await authRequest.post('/register', adminToken, {
        pseudo: 'eleve_autre',
        email: 'eleveautre@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const res = await authRequest.get(`/prof/eleves/${resEleveAutre.user.id}`, profToken);

      expect(res.status).toBe(403);
    });

    test('❌ ID invalide retourne 400 ou 404', async () => {
      const res = await authRequest.get('/prof/eleves/99999', profToken);

      expect([400, 404]).toContain(res.status);
    });
  });

  describe('POST /api/prof/eleves/:id/programmes/assigner - Assigner programme', () => {
    test('✅ Professeur peut assigner programme à son élève', async () => {
      // Créer un programme d'abord
      const progRes = await authRequest.post('/prof/programmes', profToken, {
        nom: 'Programme Test Assignation',
        description: 'Test',
        figures: []
      });

      const programmeId = progRes.body.id;

      const res = await authRequest.post(
        `/prof/eleves/${eleve1User.id}/programmes/assigner`,
        profToken,
        { programme_id: programmeId }
      );

      expect([200, 201]).toContain(res.status);
    });

    test('❌ Professeur ne peut pas assigner à élève d\'un autre prof', async () => {
      // Créer programme avec prof2
      const progRes = await authRequest.post('/prof/programmes', prof2Token, {
        nom: 'Programme Prof2',
        description: 'Test',
        figures: []
      });

      const programmeId = progRes.body.id;

      // Essayer d'assigner à élève de prof1
      const res = await authRequest.post(
        `/prof/eleves/${eleve1User.id}/programmes/assigner`,
        prof2Token,
        { programme_id: programmeId }
      );

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/prof/eleves/:id/notes - Mise à jour notes', () => {
    test('✅ Professeur peut mettre à jour notes de son élève', async () => {
      const res = await authRequest.put(
        `/prof/eleves/${eleve1User.id}/notes`,
        profToken,
        { notes: 'Excellente progression cette semaine!' }
      );

      expect([200, 204]).toContain(res.status);
    });

    test('❌ Professeur ne peut pas modifier notes d\'élève d\'un autre prof', async () => {
      const resEleveAutre = await authRequest.post('/register', adminToken, {
        pseudo: 'eleve_notes_autre',
        email: 'elevenotes@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const res = await authRequest.put(
        `/prof/eleves/${resEleveAutre.user.id}/notes`,
        prof2Token,
        { notes: 'Test notes' }
      );

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/prof/eleves/:id - Retirer élève', () => {
    test('✅ Professeur peut retirer un élève de sa liste', async () => {
      // Créer nouvel élève pour ce test
      const resEleveRetrait = await authRequest.post('/register', adminToken, {
        pseudo: 'eleve_retrait',
        email: 'eleveretrait@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      // Créer relation
      await RelationProfEleve.create({
        professeur_id: profUser.id,
        eleve_id: resEleveRetrait.user.id,
        statut: 'accepte'
      });

      const res = await authRequest.delete(
        `/prof/eleves/${resEleveRetrait.user.id}`,
        profToken
      );

      expect([200, 204]).toContain(res.status);

      // Vérifier que la relation a été supprimée
      const relation = await RelationProfEleve.findOne({
        where: {
          professeur_id: profUser.id,
          eleve_id: resEleveRetrait.user.id
        }
      });

      expect(relation).toBeNull();
    });

    test('❌ Professeur ne peut pas retirer élève d\'un autre prof', async () => {
      const res = await authRequest.delete(`/prof/eleves/${eleve1User.id}`, prof2Token);

      expect(res.status).toBe(403);
    });
  });
});
