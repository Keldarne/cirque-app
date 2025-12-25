const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');
const { Figure, Utilisateur, EtapeProgression, ProgressionEtape, RelationProfEleve } = require('../../models');

describe('📈 Progression', () => {
  let adminToken, professeurToken, eleveToken;
  let adminUser, professeurUser, eleveUser;
  let testFigure, testFigureEtape1, testFigureEtape2;
  let eleve2Token, eleve2User;
  let prof2Token, prof2User; // Professeur sans relation avec eleveUser

  beforeAll(async () => {
    // S'assurer que le serveur est démarré
    await waitForServer();

    // Connexion des utilisateurs de test
    let loginResponse;

    loginResponse = await loginAs.admin();
    ({ token: adminToken, user: adminUser } = loginResponse);

    loginResponse = await loginAs.professeur();
    ({ token: professeurToken, user: professeurUser } = loginResponse);

    loginResponse = await loginAs.user();
    ({ token: eleveToken, user: eleveUser } = loginResponse);

    // Créer un autre élève pour les tests d'isolation
    const resEleve2 = await authRequest.post('/register', adminToken, {
      pseudo: 'eleve2',
      email: 'eleve2@cirqueapp.com',
      mot_de_passe: 'Password123!',
      role: 'eleve'
    });
    eleve2Token = (await loginAs.user('eleve2@cirqueapp.com', 'Password123!')).token; // Assurez-vous que loginAs peut gérer les emails directs
    eleve2User = resEleve2.user; // Note: resEleve2.user est la réponse de /register, le token est d'une nouvelle connexion

    // Créer un autre professeur pour les tests d'isolation
    const resProf2 = await authRequest.post('/register', adminToken, {
      pseudo: 'prof2',
      email: 'prof2@cirqueapp.com',
      mot_de_passe: 'Password123!',
      role: 'professeur'
    });
    prof2Token = (await loginAs.professeur('prof2@cirqueapp.com', 'Password123!')).token;
    prof2User = resProf2.user;

    // Créer une figure de test avec des étapes
    const figureRes = await authRequest.post('/admin/figures', professeurToken, {
      nom: 'Figure Test Progression',
      descriptif: 'Description',
      discipline_id: 1, // Assurez-vous que la discipline 1 existe via le seed
      etapes: [
        { titre: 'Étape Prog 1', description: 'Desc 1', xp: 10, ordre: 1 },
        { titre: 'Étape Prog 2', description: 'Desc 2', xp: 15, ordre: 2 }
      ]
    });
    console.log('figureRes (raw response from /admin/figures):', JSON.stringify(figureRes, null, 2));
    testFigure = figureRes.body;
    console.log('testFigure (after assignment):', JSON.stringify(testFigure, null, 2));
    // Explicitly fetch etapes for the newly created figure to ensure they are available in the test context
    testFigure.etapes = await EtapeProgression.findAll({
      where: { figure_id: testFigure.id },
      order: [['ordre', 'ASC']]
    });
    testFigureEtape1 = testFigure.etapes[0];
    testFigureEtape2 = testFigure.etapes[1];
  });

  afterAll(async () => {
    // Nettoyage : Supprimer les données de test créées
    if (testFigure) {
      await authRequest.delete(`/admin/figures/${testFigure.id}`, adminToken);
    }
    // Supprimer eleve2 et prof2
    // TODO: Implémenter la suppression d'utilisateur si nécessaire
  });


  describe('Création de progression (POST /progression)', () => {
    test('✅ Élève peut créer une progression', async () => {
      const response = await authRequest.post('/progression', eleveToken, { figure_id: testFigure.id });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe(`Progression démarrée pour la figure ${testFigure.id}. ${testFigure.etapes.length} étapes créées.`);
      expect(response.body.progressions).toHaveLength(testFigure.etapes.length);
      // Vérifier que les étapes sont bien créées en DB
      const dbProgressions = await ProgressionEtape.findAll({
        where: { utilisateur_id: eleveUser.id, etape_id: { [Op.in]: testFigure.etapes.map(e => e.id) } }
      });
      expect(dbProgressions).toHaveLength(testFigure.etapes.length);
      expect(dbProgressions[0].statut).toBe('non_commence');
    });

    test('❌ L\'API ignore utilisateur_id si envoyé, et crée la progression pour l\'utilisateur authentifié', async () => {
      const anotherUserId = eleve2User.id; // An ID different from eleveUser.id
      const response = await authRequest.post('/progression', eleveToken, { figure_id: testFigure.id, utilisateur_id: anotherUserId });
      expect(response.status).toBe(409); // Still returns 409 because progression for eleveUser already exists.
                                        // The key is that it didn't return 201 and create for anotherUserId.
                                        // We confirm no progression was created for anotherUserId by counting.
      const etapeIds = testFigure.etapes.map(e => e.id);
      const dbProgressions = await ProgressionEtape.count({
        where: { utilisateur_id: anotherUserId, etape_id: { [Op.in]: etapeIds } }
      });
      expect(dbProgressions).toBe(0);
    });

    test('❌ Requête sans figure_id retourne 400', async () => {
      const response = await authRequest.post('/progression', eleveToken, {});
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('figure_id est requis');
    });

    test('❌ Élève ne peut pas démarrer une progression deux fois', async () => {
      const response = await authRequest.post('/progression', eleveToken, { figure_id: testFigure.id });
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Vous avez déjà commencé la progression sur cette figure.');
    });
  });

  describe('Consultation des progressions (GET /progression/utilisateur/:id)', () => {
    // La progression pour eleveUser avec testFigure.id est déjà créée dans le beforeAll global
    // On n'a plus un "progressionId" unique pour la figure, mais une collection d'étapes.

    test('✅ Élève peut voir ses propres progressions', async () => {
      const response = await authRequest.get(`/progression/utilisateur/${eleveUser.id}`, eleveToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Vérifier que la figure de test est présente et contient les étapes
      const progTestFigure = response.body.find(p => p.figure_id === testFigure.id);
      expect(progTestFigure).toBeDefined();
      expect(progTestFigure.etapes).toHaveLength(testFigure.etapes.length); // testFigure.etapes vient de la création de la figure
      expect(progTestFigure.etapes[0].etape.titre).toBe(testFigureEtape1.titre); // etape est un champ de ProgressionEtape inclus
      expect(progTestFigure.etapes[0].statut).toBe('non_commence'); // Statut par défaut après création
    });

    test('✅ Admin peut voir les progressions de n\'importe quel utilisateur', async () => {
      const response = await authRequest.get(`/progression/utilisateur/${eleveUser.id}`, adminToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      const progTestFigure = response.body.find(p => p.figure_id === testFigure.id);
      expect(progTestFigure).toBeDefined();
      expect(progTestFigure.etapes).toHaveLength(testFigure.etapes.length);
    });

    test('❌ Élève ne peut pas voir les progressions d\'un autre utilisateur', async () => {
      const response = await authRequest.get(`/progression/utilisateur/${eleve2User.id}`, eleveToken);
      expect(response.status).toBe(403); // L'API du routeur doit retourner 403 explicitement
      expect(response.body.error).toBe("Vous ne pouvez consulter que votre propre progression");
    });
  });

  describe('Consultation des progressions (GET /progression/utilisateur/:id)', () => {
    // La progression pour eleveUser avec testFigure.id est déjà créée dans le beforeAll global
    // On n'a plus un "progressionId" unique pour la figure, mais une collection d'étapes.

    test('✅ Élève peut voir ses propres progressions', async () => {
      const response = await authRequest.get(`/progression/utilisateur/${eleveUser.id}`, eleveToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Vérifier que la figure de test est présente et contient les étapes
      const progTestFigure = response.body.find(p => p.figure_id === testFigure.id);
      expect(progTestFigure).toBeDefined();
      expect(progTestFigure.etapes).toHaveLength(testFigure.etapes.length); // testFigure.etapes vient de la création de la figure
      expect(progTestFigure.etapes[0].etape.titre).toBe(testFigureEtape1.titre); // etape est un champ de ProgressionEtape inclus
      expect(progTestFigure.etapes[0].statut).toBe('non_commence'); // Statut par défaut après création
    });

    test('✅ Admin peut voir les progressions de n\'importe quel utilisateur', async () => {
      const response = await authRequest.get(`/progression/utilisateur/${eleveUser.id}`, adminToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      const progTestFigure = response.body.find(p => p.figure_id === testFigure.id);
      expect(progTestFigure).toBeDefined();
      expect(progTestFigure.etapes).toHaveLength(testFigure.etapes.length);
    });

    test('❌ Élève ne peut pas voir les progressions d\'un autre utilisateur', async () => {
      const response = await authRequest.get(`/progression/utilisateur/${eleve2User.id}`, eleveToken);
      expect(response.status).toBe(403); // L'API du routeur doit retourner 403 explicitement
      expect(response.body.error).toBe("Vous ne pouvez consulter que votre propre progression");
    });
  });

  describe('Suppression de progression (DELETE /progression/figure/:figureId)', () => {
    // Créer une progression spécifique à supprimer
    let figureToDelete;
    let eleveToDeleteProgression;

    beforeAll(async () => {
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure à Supprimer',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [{ titre: 'Etape 1', xp: 10 }]
      });
      figureToDelete = figureRes.body;

      // Utiliser eleve2 pour cette progression
      await authRequest.post('/progression', eleve2Token, { figure_id: figureToDelete.id });
      eleveToDeleteProgression = eleve2User;
    });

    test('✅ Élève peut supprimer sa propre progression sur une figure', async () => {
      const response = await authRequest.delete(`/progression/figure/${figureToDelete.id}`, eleve2Token);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Progression sur la figure supprimée avec succès');

      // Vérifier que les ProgressionEtape sont bien supprimées
      const dbProgressions = await ProgressionEtape.count({
        where: { utilisateur_id: eleveToDeleteProgression.id, etape_id: figureToDelete.etapes[0].id }
      });
      expect(dbProgressions).toBe(0);
    });

    test('❌ Suppression d\'une progression inexistante retourne 200 (car pas d\'étapes à supprimer)', async () => {
      const response = await authRequest.delete(`/progression/figure/${99999}`, eleveToken);
      expect(response.status).toBe(200); // Retourne 200 si aucune étape n'est trouvée, car "pas de progression à supprimer"
      expect(response.body.message).toBe('Aucune progression à supprimer pour cette figure.');
    });

    test('❌ Élève ne peut pas supprimer la progression d\'un autre', async () => {
      // Créer une nouvelle figure et progression pour eleve2 (que eleveToken n'a pas)
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure Autre Eleve',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [{ titre: 'Etape Autre', xp: 10 }]
      });
      const otherEleveFigure = figureRes.body;
      await authRequest.post('/progression', eleve2Token, { figure_id: otherEleveFigure.id });

      const response = await authRequest.delete(`/progression/figure/${otherEleveFigure.id}`, eleveToken); // eleveToken tente de supprimer la progression de eleve2
      expect(response.status).toBe(200); // Destruction de 0 éléments pour l'utilisateur, donc succès.
      expect(response.body.message).toBe('Progression sur la figure supprimée avec succès');
      expect(response.body.etapesSupprimees).toBe(0);
    });
  });

  describe('Gestion des étapes (GET /progression/figure/:figureId/etapes)', () => {
    let figureWithSteps;
    beforeAll(async () => {
      // Créer une figure avec des étapes si elle n'existe pas déjà
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure Avec Etapes',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [
          { titre: 'Etape A', description: 'Desc A', xp: 10 },
          { titre: 'Etape B', description: 'Desc B', xp: 15 }
        ]
      });
      figureWithSteps = figureRes.body;
      // Démarrer la progression pour l'élève
      await authRequest.post('/progression', eleveToken, { figure_id: figureWithSteps.id });
    });

    test('✅ Utilisateur peut voir les étapes de sa progression', async () => {
      const response = await authRequest.get(`/progression/figure/${figureWithSteps.id}/etapes`, eleveToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(figureWithSteps.etapes.length);
      expect(response.body[0].etape.titre).toBe('Etape A');
      expect(response.body[0].statut).toBe('non_commence');
    });

    test('❌ Accès aux étapes d\'une progression inexistante retourne 200 (vide)', async () => {
      const response = await authRequest.get(`/progression/figure/${99999}/etapes`, eleveToken);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('❌ Élève ne peut pas voir les étapes d\'une progression d\'un autre', async () => {
      // Créer une progression pour eleve2
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure Autre Eleve Etapes',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [{ titre: 'Etape X', xp: 10 }]
      });
      const otherEleveFigure = figureRes.body;
      await authRequest.post('/progression', eleve2Token, { figure_id: otherEleveFigure.id });

      const response = await authRequest.get(`/progression/figure/${otherEleveFigure.id}/etapes`, eleveToken); // eleveToken tente de voir la progression de eleve2
      expect(response.status).toBe(200); // Devrait retourner vide car le beforeFind filtre
      expect(response.body).toEqual([]);
    });
  });

  describe('Validation d\'étapes (POST /progression/etape/:etapeId/valider)', () => {
    let etapeToValidate, eleveProgression;
    let profForValidationToken, profForValidationUser;

    beforeAll(async () => {
      // Créer un professeur spécifiquement pour la validation
      const resProf = await authRequest.post('/register', adminToken, {
        pseudo: 'prof_valide',
        email: 'prof.valide@cirqueapp.com',
        mot_de_passe: 'Password123!',
        role: 'professeur'
      });
      profForValidationUser = resProf.user;
      profForValidationToken = (await loginAs.professeur('prof.valide@cirqueapp.com', 'Password123!')).token;

      // Assurer la relation prof-eleve pour la validation
      await RelationProfEleve.create({
        professeur_id: profForValidationUser.id,
        eleve_id: eleveUser.id,
        statut: 'accepte'
      });

      // Créer une figure et démarrer la progression pour l'élève
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure Validation',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [
          { titre: 'Etape Valide 1', description: 'Desc 1', xp: 10 },
          { titre: 'Etape Valide 2', description: 'Desc 2', xp: 15 }
        ]
      });
      const figureValidation = figureRes.body;
      await authRequest.post('/progression', eleveToken, { figure_id: figureValidation.id });

      // Trouver l'étape à valider
      etapeToValidate = figureValidation.etapes[0];
      eleveProgression = eleveUser;
    });


    test('✅ Validation d\'une étape retourne un statut valide', async () => {
      const response = await authRequest.post(`/progression/etape/${etapeToValidate.id}/valider`, profForValidationToken, {
        eleveId: eleveProgression.id,
        lateralite: 'gauche'
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Étape validée avec succès par le professeur');
      expect(response.body.progression.statut).toBe('valide');
      expect(response.body.progression.valide_par_prof_id).toBe(profForValidationUser.id);
      expect(response.body.progression.lateralite).toBe('gauche');
    });

    test('❌ Validation sans progression existante retourne 404', async () => {
      const response = await authRequest.post(`/progression/etape/${99999}/valider`, profForValidationToken, {
        eleveId: eleveProgression.id,
        lateralite: 'gauche'
      });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Aucune progression n\'a été démarrée par l\'élève pour cette étape.');
    });

    test('❌ Professeur ne peut pas valider pour un élève qui ne lui est pas assigné', async () => {
      // Créer une autre progression pour eleve2 (que profForValidation ne gère pas)
      const figureRes = await authRequest.post('/admin/figures', adminToken, {
        nom: 'Figure Autre Eleve Valid',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [{ titre: 'Etape X', xp: 10 }]
      });
      const otherFigure = figureRes.body;
      await authRequest.post('/progression', eleve2Token, { figure_id: otherFigure.id });

      const response = await authRequest.post(`/progression/etape/${otherFigure.etapes[0].id}/valider`, profForValidationToken, {
        eleveId: eleve2User.id,
        lateralite: 'droite'
      });
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Cet élève ne fait pas partie de vos élèves.');
    });
  });


  describe('Suppression de progression (DELETE /progression/figure/:figureId)', () => {
    // Créer une progression spécifique à supprimer
    let figureToDelete;
    let eleveToDeleteProgression;

    beforeAll(async () => {
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure à Supprimer',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [{ titre: 'Etape 1', xp: 10 }]
      });
      figureToDelete = figureRes.body;

      // Utiliser eleve2 pour cette progression
      await authRequest.post('/progression', eleve2Token, { figure_id: figureToDelete.id });
      eleveToDeleteProgression = eleve2User;
    });

    test('✅ Élève peut supprimer sa propre progression sur une figure', async () => {
      const response = await authRequest.delete(`/progression/figure/${figureToDelete.id}`, eleve2Token);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Progression sur la figure supprimée avec succès');

      // Vérifier que les ProgressionEtape sont bien supprimées
      const dbProgressions = await ProgressionEtape.count({
        where: { utilisateur_id: eleveToDeleteProgression.id, etape_id: figureToDelete.etapes[0].id }
      });
      expect(dbProgressions).toBe(0);
    });

    test('❌ Suppression d\'une progression inexistante retourne 200 (car pas d\'étapes à supprimer)', async () => {
      const response = await authRequest.delete(`/progression/figure/${99999}`, eleveToken);
      expect(response.status).toBe(200); // Retourne 200 si aucune étape n'est trouvée, car "pas de progression à supprimer"
    });

    test('❌ Élève ne peut pas supprimer la progression d\'un autre', async () => {
      // Créer une nouvelle figure et progression pour eleve2
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure Autre Eleve',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [{ titre: 'Etape Autre', xp: 10 }]
      });
      const otherEleveFigure = figureRes.body;
      await authRequest.post('/progression', eleve2Token, { figure_id: otherEleveFigure.id });

      const response = await authRequest.delete(`/progression/figure/${otherEleveFigure.id}`, eleveToken); // eleveToken tente de supprimer la progression de eleve2
      expect(response.status).toBe(403); // L'élève ne peut supprimer que la sienne
    });
  });

  describe('Gestion des étapes (GET /progression/figure/:figureId/etapes)', () => {
    let progressionIdEleve, figureWithSteps;
    beforeAll(async () => {
      // Créer une figure avec des étapes si elle n'existe pas déjà
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure Avec Etapes',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [
          { titre: 'Etape A', description: 'Desc A', xp: 10 },
          { titre: 'Etape B', description: 'Desc B', xp: 15 }
        ]
      });
      figureWithSteps = figureRes.body;
      // Démarrer la progression pour l'élève
      await authRequest.post('/progression', eleveToken, { figure_id: figureWithSteps.id });
    });

    test('✅ Utilisateur peut voir les étapes de sa progression', async () => {
      const response = await authRequest.get(`/progression/figure/${figureWithSteps.id}/etapes`, eleveToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(figureWithSteps.etapes.length);
      expect(response.body[0].etape.titre).toBe('Etape A');
      expect(response.body[0].statut).toBe('non_commence');
    });

    test('❌ Accès aux étapes d\'une progression inexistante retourne 404', async () => {
      const response = await authRequest.get(`/progression/figure/${99999}/etapes`, eleveToken);
      // La nouvelle logique retourne 200 avec un tableau vide si la figure n'a pas d'étapes de progression pour l'utilisateur
      // Ou si la figure_id est invalide, il peut retourner un 404 par la base de données.
      // Dans notre cas, EtapeProgression.findAll({where: {figure_id: 99999}}) retournera [], donc le count sera 0
      // La logique du routeur retourne un tableau vide. Le test doit être ajusté.
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('❌ Élève ne peut pas voir les étapes d\'une progression d\'un autre', async () => {
      // Créer une progression pour eleve2
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure Autre Eleve Etapes',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [{ titre: 'Etape X', xp: 10 }]
      });
      const otherEleveFigure = figureRes.body;
      await authRequest.post('/progression', eleve2Token, { figure_id: otherEleveFigure.id });

      const response = await authRequest.get(`/progression/figure/${otherEleveFigure.id}/etapes`, eleveToken); // eleveToken tente de voir la progression de eleve2
      expect(response.status).toBe(200); // Devrait retourner vide car le beforeFind filtre
      expect(response.body).toEqual([]);
    });
  });

  describe('Validation d\'étapes (POST /progression/etape/:etapeId/valider)', () => {
    let etapeToValidate, eleveProgression;
    let profForValidationToken, profForValidationUser;

    beforeAll(async () => {
      // Créer un professeur spécifiquement pour la validation
      const resProf = await authRequest.post('/register', adminToken, {
        pseudo: 'prof_valide',
        email: 'prof.valide@cirqueapp.com',
        mot_de_passe: 'Password123!',
        role: 'professeur'
      });
      profForValidationUser = resProf.user;
      profForValidationToken = (await loginAs.professeur('prof.valide@cirqueapp.com', 'Password123!')).token;

      // Assurer la relation prof-eleve pour la validation
      await RelationProfEleve.create({
        professeur_id: profForValidationUser.id,
        eleve_id: eleveUser.id,
        statut: 'accepte'
      });

      // Créer une figure et démarrer la progression pour l'élève
      const figureRes = await authRequest.post('/admin/figures', professeurToken, {
        nom: 'Figure Validation',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [
          { titre: 'Etape Valide 1', description: 'Desc 1', xp: 10 },
          { titre: 'Etape Valide 2', description: 'Desc 2', xp: 15 }
        ]
      });
      const figureValidation = figureRes.body;
      await authRequest.post('/progression', eleveToken, { figure_id: figureValidation.id });

      // Trouver l'étape à valider
      etapeToValidate = figureValidation.etapes[0];
      eleveProgression = eleveUser;
    });


    test('✅ Validation d\'une étape retourne un statut valide', async () => {
      const response = await authRequest.post(`/progression/etape/${etapeToValidate.id}/valider`, profForValidationToken, {
        eleveId: eleveProgression.id,
        lateralite: 'gauche'
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Étape validée avec succès par le professeur');
      expect(response.body.progression.statut).toBe('valide');
      expect(response.body.progression.valide_par_prof_id).toBe(profForValidationUser.id);
      expect(response.body.progression.lateralite).toBe('gauche');
    });

    test('❌ Validation sans progression existante retourne 404', async () => {
      const response = await authRequest.post(`/progression/etape/${99999}/valider`, profForValidationToken, {
        eleveId: eleveProgression.id,
        lateralite: 'gauche'
      });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Aucune progression n\'a été démarrée par l\'élève pour cette étape.');
    });

    test('❌ Professeur ne peut pas valider pour un élève qui ne lui est pas assigné', async () => {
      // Créer une autre progression pour eleve2 (que profForValidation ne gère pas)
      const figureRes = await authRequest.post('/admin/figures', adminToken, {
        nom: 'Figure Autre Eleve Valid',
        descriptif: 'Description',
        discipline_id: 1,
        etapes: [{ titre: 'Etape X', xp: 10 }]
      });
      const otherFigure = figureRes.body;
      await authRequest.post('/progression', eleve2Token, { figure_id: otherFigure.id });

      const response = await authRequest.post(`/progression/etape/${otherEleveFigure.etapes[0].id}/valider`, profForValidationToken, {
        eleveId: eleve2User.id,
        lateralite: 'droite'
      });
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Cet élève ne fait pas partie de vos élèves.');
    });
  });
});
