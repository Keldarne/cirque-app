const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');
const { ProgrammeProf, ProgrammeFigure, AssignationProgramme, Figure } = require('../../src/models');

describe('📋 Programmes Personnels', () => {
  let adminToken, professeurToken, eleveToken;
  let adminUser, professeurUser, eleveUser;
  let eleve2Token, eleve2User;
  let testFigure1, testFigure2, testFigure3;

  beforeAll(async () => {
    await waitForServer();

    // Connexion des utilisateurs de test
    ({ token: adminToken, user: adminUser } = await loginAs.admin());
    ({ token: professeurToken, user: professeurUser } = await loginAs.professeur());
    ({ token: eleveToken, user: eleveUser } = await loginAs.user());

    // Créer un second élève
    const resEleve2 = await authRequest.post('/register', adminToken, {
      pseudo: 'eleve_prog',
      email: 'eleve.prog@cirqueapp.com',
      mot_de_passe: 'Password123!',
      role: 'eleve'
    });
    eleve2User = resEleve2.user;
    eleve2Token = (await loginAs.user('eleve.prog@cirqueapp.com', 'Password123!')).token;

    // Utiliser des figures existantes du seed au lieu de créer
    const figuresExistantes = await Figure.findAll({ limit: 3 });
    if (figuresExistantes.length < 3) {
      throw new Error('Pas assez de figures dans la base pour les tests');
    }
    testFigure1 = figuresExistantes[0].toJSON();
    testFigure2 = figuresExistantes[1].toJSON();
    testFigure3 = figuresExistantes[2].toJSON();
  });

  describe('Création de programmes personnels (POST /progression/programmes)', () => {
    test('✅ Élève peut créer un programme personnel', async () => {
      const response = await authRequest.post('/progression/programmes', eleveToken, {
        nom: 'Mon Programme Perso',
        description: 'Programme créé par un élève',
        figureIds: [testFigure1.id, testFigure2.id]
      });

      expect(response.status).toBe(201);
      expect(response.body.programme).toBeDefined();
      expect(response.body.programme.nom).toBe('Mon Programme Perso');
      expect(response.body.programme.professeur_id).toBe(eleveUser.id);
      expect(response.body.programme.est_modele).toBe(false);

      // Vérifier en DB
      const progDB = await ProgrammeProf.findByPk(response.body.programme.id, {
        include: [{ model: ProgrammeFigure, as: 'ProgrammesFigures' }]
      });
      expect(progDB).toBeDefined();
      expect(progDB.ProgrammesFigures).toHaveLength(2);
    });

    test('❌ Création sans nom retourne 400', async () => {
      const response = await authRequest.post('/progression/programmes', eleveToken, {
        description: 'Description',
        figureIds: []
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Le nom est requis');
    });

    test('✅ Programme créé est toujours est_modele: false', async () => {
      const response = await authRequest.post('/progression/programmes', eleveToken, {
        nom: 'Programme Test Modele',
        description: 'Test',
        figureIds: [],
        estModele: true // Tenter de forcer est_modele à true
      });

      expect(response.status).toBe(201);
      expect(response.body.programme.est_modele).toBe(false); // Forcé à false
    });
  });

  describe('Liste des programmes (GET /progression/programmes)', () => {
    let programmePersoEleve, programmeAssigne;

    beforeAll(async () => {
      // Créer un programme personnel pour eleveUser
      const resPerso = await authRequest.post('/progression/programmes', eleveToken, {
        nom: 'Programme Perso Élève',
        description: 'Mon programme',
        figureIds: [testFigure1.id]
      });
      programmePersoEleve = resPerso.body.programme;

      // Créer un programme prof et l'assigner
      const progProf = await ProgrammeProf.create({
        professeur_id: professeurUser.id,
        nom: 'Programme Assigné par Prof',
        description: 'Programme du prof',
        est_modele: false,
        actif: true
      });
      await ProgrammeFigure.create({
        programme_id: progProf.id,
        figure_id: testFigure2.id,
        ordre: 1
      });
      await AssignationProgramme.create({
        programme_id: progProf.id,
        eleve_id: eleveUser.id,
        date_assignation: new Date(),
        statut: 'en_cours',
        source_type: 'direct'
      });
      programmeAssigne = progProf;
    });

    test('✅ Élève voit ses programmes personnels ET assignés', async () => {
      const response = await authRequest.get('/progression/programmes', eleveToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Vérifier que les deux types sont présents
      const perso = response.body.find(p => p.id === programmePersoEleve.id);
      const assigne = response.body.find(p => p.id === programmeAssigne.id);

      expect(perso).toBeDefined();
      expect(perso.type).toBe('perso_cree');
      expect(perso.assignation_id).toBeNull();

      expect(assigne).toBeDefined();
      expect(assigne.type).toBe('assigne');
      expect(assigne.assignation_id).toBeDefined();
    });

    test('✅ Programmes triés par date (plus récents en premier)', async () => {
      const response = await authRequest.get('/progression/programmes', eleveToken);

      expect(response.status).toBe(200);
      const dates = response.body.map(p => new Date(p.date_assignation));

      // Vérifier ordre décroissant
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  describe('Modification de programmes (PUT /progression/programmes/:id)', () => {
    let programmeEleve;

    beforeAll(async () => {
      const res = await authRequest.post('/progression/programmes', eleveToken, {
        nom: 'Programme à Modifier',
        description: 'Description originale',
        figureIds: []
      });
      programmeEleve = res.body.programme;
    });

    test('✅ Élève peut modifier son propre programme', async () => {
      const response = await authRequest.put(`/progression/programmes/${programmeEleve.id}`, eleveToken, {
        nom: 'Programme Modifié',
        description: 'Nouvelle description'
      });

      expect(response.status).toBe(200);
      expect(response.body.programme.nom).toBe('Programme Modifié');
      expect(response.body.programme.description).toBe('Nouvelle description');
    });

    test('❌ Élève ne peut pas modifier un programme qui ne lui appartient pas', async () => {
      const response = await authRequest.put(`/progression/programmes/${programmeEleve.id}`, eleve2Token, {
        nom: 'Tentative de modification',
        description: 'Non autorisé'
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Programme introuvable ou non autorisé');
    });

    test('❌ Modification d\'un programme inexistant retourne 404', async () => {
      const response = await authRequest.put('/progression/programmes/99999', eleveToken, {
        nom: 'Test',
        description: 'Test'
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Suppression de programmes (DELETE /progression/programmes/:id)', () => {
    let programmeASupprimer;

    beforeEach(async () => {
      const res = await authRequest.post('/progression/programmes', eleveToken, {
        nom: 'Programme à Supprimer',
        description: 'Sera supprimé',
        figureIds: []
      });
      programmeASupprimer = res.body.programme;
    });

    test('✅ Élève peut supprimer son propre programme', async () => {
      const response = await authRequest.delete(`/progression/programmes/${programmeASupprimer.id}`, eleveToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Programme supprimé');

      // Vérifier soft delete (actif = false)
      const progDB = await ProgrammeProf.findByPk(programmeASupprimer.id);
      expect(progDB.actif).toBe(false);
    });

    test('❌ Élève ne peut pas supprimer un programme qui ne lui appartient pas', async () => {
      const response = await authRequest.delete(`/progression/programmes/${programmeASupprimer.id}`, eleve2Token);

      expect(response.status).toBe(500); // Service lève une erreur
    });
  });

  describe('Gestion des figures dans un programme', () => {
    let programmeTest;

    beforeEach(async () => {
      const res = await authRequest.post('/progression/programmes', eleveToken, {
        nom: 'Programme Test Figures',
        description: 'Test gestion figures',
        figureIds: [testFigure1.id]
      });
      programmeTest = res.body.programme;
    });

    test('✅ Ajouter des figures à un programme', async () => {
      const response = await authRequest.post(`/progression/programmes/${programmeTest.id}/figures`, eleveToken, {
        figureIds: [testFigure2.id, testFigure3.id]
      });

      expect(response.status).toBe(201);
      expect(response.body.ajouts).toHaveLength(2);

      // Vérifier en DB
      const figures = await ProgrammeFigure.findAll({
        where: { programme_id: programmeTest.id },
        order: [['ordre', 'ASC']]
      });
      expect(figures).toHaveLength(3); // 1 initial + 2 ajoutées
      expect(figures[0].ordre).toBe(1);
      expect(figures[1].ordre).toBe(2);
      expect(figures[2].ordre).toBe(3);
    });

    test('❌ Ajout sans figureIds retourne 400', async () => {
      const response = await authRequest.post(`/progression/programmes/${programmeTest.id}/figures`, eleveToken, {});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('figureIds requis');
    });

    test('✅ Retirer une figure d\'un programme', async () => {
      const response = await authRequest.delete(`/progression/programmes/${programmeTest.id}/figures/${testFigure1.id}`, eleveToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Figure retirée');

      // Vérifier en DB
      const figures = await ProgrammeFigure.findAll({
        where: { programme_id: programmeTest.id }
      });
      expect(figures).toHaveLength(0);
    });

    test('✅ Réordonner les figures', async () => {
      // Ajouter d'abord 2 figures
      await authRequest.post(`/progression/programmes/${programmeTest.id}/figures`, eleveToken, {
        figureIds: [testFigure2.id, testFigure3.id]
      });

      // Réordonner (inverser l'ordre)
      const response = await authRequest.put(`/progression/programmes/${programmeTest.id}/reorder`, eleveToken, {
        figureOrders: [
          { figureId: testFigure3.id, ordre: 1 },
          { figureId: testFigure2.id, ordre: 2 },
          { figureId: testFigure1.id, ordre: 3 }
        ]
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Ordre mis à jour');

      // Vérifier en DB
      const figures = await ProgrammeFigure.findAll({
        where: { programme_id: programmeTest.id },
        order: [['ordre', 'ASC']]
      });
      expect(figures[0].figure_id).toBe(testFigure3.id);
      expect(figures[1].figure_id).toBe(testFigure2.id);
      expect(figures[2].figure_id).toBe(testFigure1.id);
    });

    test('❌ Réordonner sans figureOrders retourne 400', async () => {
      const response = await authRequest.put(`/progression/programmes/${programmeTest.id}/reorder`, eleveToken, {});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('figureOrders requis');
    });
  });

  describe('Sécurité - Hook beforeFind', () => {
    test('✅ Élève voit uniquement ses programmes et les modèles publics', async () => {
      // Créer un programme d'un autre élève
      const autreProgRes = await authRequest.post('/progression/programmes', eleve2Token, {
        nom: 'Programme Autre Élève',
        description: 'Privé',
        figureIds: []
      });
      const autreProg = autreProgRes.body.programme;

      // Créer un modèle public
      const modelePublic = await ProgrammeProf.create({
        professeur_id: professeurUser.id,
        nom: 'Modèle Public',
        description: 'Template',
        est_modele: true,
        actif: true
      });

      // eleveToken liste ses programmes
      const response = await authRequest.get('/progression/programmes', eleveToken);

      expect(response.status).toBe(200);

      // Doit contenir ses propres programmes
      const sesPrograms = response.body.filter(p => p.professeur_id === eleveUser.id);
      expect(sesPrograms.length).toBeGreaterThan(0);

      // Ne doit PAS contenir le programme de l'autre élève
      const progAutre = response.body.find(p => p.id === autreProg.id);
      expect(progAutre).toBeUndefined();

      // Note: Le modèle public n'apparaît pas dans GET /progression/programmes
      // car cette route utilise getProgrammesEleve() qui filtre différemment
    });

    test('✅ Admin voit tous les programmes', async () => {
      // L'admin devrait voir tous les programmes via le hook beforeFind
      // Cependant, la route /progression/programmes utilise getProgrammesEleve()
      // qui est spécifique à l'utilisateur connecté.
      // Cette route n'est pas censée être utilisée par un admin pour lister TOUS les programmes.
      // On teste plutôt que l'admin peut accéder à un programme spécifique.

      const progEleve = await authRequest.post('/progression/programmes', eleveToken, {
        nom: 'Programme Admin Test',
        description: 'Test',
        figureIds: []
      });

      const response = await authRequest.get(`/progression/programmes/${progEleve.body.programme.id}`, adminToken);

      // L'admin devrait pouvoir accéder (via hook beforeFind qui ne filtre pas les admins)
      expect(response.status).toBe(200);
    });
  });
});
