const { authRequest, loginAs, waitForServer } = require('../../helpers/auth-helper');
const { Utilisateur, RelationProfEleve, Groupe, MembreGroupe, ProgressionEtape, EtapeProgression, Figure } = require('../../../src/models');

describe('💡 Routes Prof - Suggestions', () => {
  let adminToken, profToken, eleveToken;
  let adminUser, profUser, eleveUser;
  let prof2Token, prof2User;
  let figureId;

  beforeAll(async () => {
    await waitForServer();

    // Login utilisateurs
    ({ token: adminToken, user: adminUser } = await loginAs.admin());
    ({ token: profToken, user: profUser } = await loginAs.professeur());
    ({ token: eleveToken, user: eleveUser } = await loginAs.user());

    // Créer prof2
    const resProf2 = await authRequest.post('/register', adminToken, {
      pseudo: 'prof_suggestions_2',
      email: 'profsugg2@test.com',
      mot_de_passe: 'Password123!',
      role: 'professeur'
    });
    prof2User = resProf2.user;
    ({ token: prof2Token } = await loginAs.professeur('profsugg2@test.com', 'Password123!'));

    // Créer relation prof1 - eleve1
    await RelationProfEleve.create({
      professeur_id: profUser.id,
      eleve_id: eleveUser.id,
      statut: 'accepte'
    });

    // Créer une figure pour les tests
    const figureRes = await authRequest.post('/admin/figures', adminToken, {
      nom: 'Figure Suggestions Test',
      descriptif: 'Test',
      discipline_id: 1,
      etapes: [
        { titre: 'Étape Test 1', description: 'Test', xp: 10, ordre: 1 }
      ]
    });
    figureId = figureRes.body.id;
  });

  describe('GET /api/prof/suggestions/eleve/:eleveId', () => {
    test('✅ Professeur récupère suggestions pour son élève', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/eleve/${eleveUser.id}`,
        profToken
      );

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('suggestions');
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });

    test('✅ Admin récupère suggestions pour n\'importe quel élève', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/eleve/${eleveUser.id}`,
        adminToken
      );

      expect(res.status).toBe(200);
      expect(res.body.suggestions).toBeDefined();
    });

    test('✅ Suggestions contiennent figure, score et raison', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/eleve/${eleveUser.id}`,
        profToken
      );

      expect(res.status).toBe(200);

      if (res.body.suggestions.length > 0) {
        const suggestion = res.body.suggestions[0];
        expect(suggestion).toHaveProperty('figure');
        expect(suggestion).toHaveProperty('score_pertinence');
        expect(suggestion).toHaveProperty('raison');
        expect(suggestion.figure).toHaveProperty('id');
        expect(suggestion.figure).toHaveProperty('nom');
      }
    });

    test('✅ Suggestions triées par score décroissant', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/eleve/${eleveUser.id}`,
        profToken
      );

      expect(res.status).toBe(200);

      if (res.body.suggestions.length > 1) {
        for (let i = 0; i < res.body.suggestions.length - 1; i++) {
          expect(res.body.suggestions[i].score_pertinence)
            .toBeGreaterThanOrEqual(res.body.suggestions[i + 1].score_pertinence);
        }
      }
    });

    test('❌ Professeur ne peut pas voir suggestions d\'élève d\'un autre prof', async () => {
      // Créer élève non lié
      const resAutreEleve = await authRequest.post('/register', adminToken, {
        pseudo: 'eleve_sugg_autre',
        email: 'elevesugg@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });

      const res = await authRequest.get(
        `/prof/suggestions/eleve/${resAutreEleve.user.id}`,
        profToken
      );

      expect(res.status).toBe(403);
    });

    test('❌ Élève ne peut pas accéder aux suggestions', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/eleve/${eleveUser.id}`,
        eleveToken
      );

      expect(res.status).toBe(403);
    });

    test('❌ ID élève invalide retourne 400 ou 404', async () => {
      const res = await authRequest.get('/prof/suggestions/eleve/99999', profToken);

      expect([400, 404]).toContain(res.status);
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/eleve/${eleveUser.id}`,
        null
      );

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/prof/suggestions/groupe/:groupeId', () => {
    let groupeId;

    beforeAll(async () => {
      // Créer un groupe
      const groupeRes = await authRequest.post('/prof/groupes', profToken, {
        nom: 'Groupe Suggestions Test',
        description: 'Test'
      });
      groupeId = groupeRes.body.id;

      // Ajouter élève au groupe
      await MembreGroupe.create({
        groupe_id: groupeId,
        utilisateur_id: eleveUser.id
      });
    });

    test('✅ Professeur récupère suggestions pour son groupe', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/groupe/${groupeId}`,
        profToken
      );

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('suggestions');
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });

    test('✅ Admin récupère suggestions pour n\'importe quel groupe', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/groupe/${groupeId}`,
        adminToken
      );

      expect(res.status).toBe(200);
      expect(res.body.suggestions).toBeDefined();
    });

    test('✅ Suggestions groupe contiennent nb_eleves_prets', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/groupe/${groupeId}`,
        profToken
      );

      expect(res.status).toBe(200);

      if (res.body.suggestions.length > 0) {
        const suggestion = res.body.suggestions[0];
        expect(suggestion).toHaveProperty('nb_eleves_prets');
        expect(typeof suggestion.nb_eleves_prets).toBe('number');
      }
    });

    test('❌ Professeur ne peut pas voir suggestions groupe d\'un autre prof', async () => {
      // Créer groupe avec prof2
      const groupeRes = await authRequest.post('/prof/groupes', prof2Token, {
        nom: 'Groupe Prof2 Suggestions',
        description: 'Test'
      });

      const res = await authRequest.get(
        `/prof/suggestions/groupe/${groupeRes.body.id}`,
        profToken
      );

      expect(res.status).toBe(403);
    });

    test('❌ Groupe inexistant retourne 404', async () => {
      const res = await authRequest.get('/prof/suggestions/groupe/99999', profToken);

      expect(res.status).toBe(404);
    });

    test('❌ Élève ne peut pas accéder aux suggestions groupe', async () => {
      const res = await authRequest.get(
        `/prof/suggestions/groupe/${groupeId}`,
        eleveToken
      );

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/prof/suggestions/:suggestionId/accepter', () => {
    test('✅ Professeur peut accepter une suggestion', async () => {
      // Get suggestions first
      const suggestionsRes = await authRequest.get(
        `/prof/suggestions/eleve/${eleveUser.id}`,
        profToken
      );

      if (suggestionsRes.body.suggestions.length > 0) {
        const suggestionId = suggestionsRes.body.suggestions[0].figure.id;

        const res = await authRequest.post(
          `/prof/suggestions/${suggestionId}/accepter`,
          profToken,
          { eleve_id: eleveUser.id }
        );

        expect([200, 201, 204]).toContain(res.status);
      }
    });

    test('❌ Suggestion inexistante retourne 404', async () => {
      const res = await authRequest.post(
        '/prof/suggestions/99999/accepter',
        profToken,
        { eleve_id: eleveUser.id }
      );

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/prof/suggestions/:suggestionId/ignorer', () => {
    test('✅ Professeur peut ignorer une suggestion', async () => {
      const suggestionsRes = await authRequest.get(
        `/prof/suggestions/eleve/${eleveUser.id}`,
        profToken
      );

      if (suggestionsRes.body.suggestions.length > 0) {
        const suggestionId = suggestionsRes.body.suggestions[0].figure.id;

        const res = await authRequest.post(
          `/prof/suggestions/${suggestionId}/ignorer`,
          profToken,
          { eleve_id: eleveUser.id }
        );

        expect([200, 204]).toContain(res.status);
      }
    });
  });
});
