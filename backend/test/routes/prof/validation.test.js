const request = require('supertest');
const app = require('../../../server');
const { sequelize, ProgressionEtape, EtapeProgression, Figure, RelationProfEleve, Utilisateur } = require('../../../src/models');

describe('POST /api/prof/validation/eleves/:eleveId/figures/:figureId - Bulk Validation', () => {
  let profToken, adminToken, eleveId, figureId, profId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Créer admin
    const adminRes = await request(app)
      .post('/api/utilisateurs/register')
      .send({
        pseudo: 'admin_test',
        email: 'admin@test.com',
        mot_de_passe: 'Password123!',
        role: 'admin'
      });

    const adminLogin = await request(app)
      .post('/api/utilisateurs/login')
      .send({
        email: 'admin@test.com',
        mot_de_passe: 'Password123!'
      });
    adminToken = adminLogin.body.token;

    // Créer professeur
    const profRes = await request(app)
      .post('/api/utilisateurs/register')
      .send({
        pseudo: 'prof_test',
        email: 'prof@test.com',
        mot_de_passe: 'Password123!',
        role: 'professeur'
      });

    profId = profRes.body.user.id;

    const profLogin = await request(app)
      .post('/api/utilisateurs/login')
      .send({
        email: 'prof@test.com',
        mot_de_passe: 'Password123!'
      });
    profToken = profLogin.body.token;

    // Créer élève
    const eleveRes = await request(app)
      .post('/api/utilisateurs/register')
      .send({
        pseudo: 'eleve_test',
        email: 'eleve@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });
    eleveId = eleveRes.body.user.id;

    // Créer relation prof-élève
    await RelationProfEleve.create({
      professeur_id: profId,
      eleve_id: eleveId,
      statut: 'accepte'
    });

    // Créer figure avec étapes
    const figureRes = await request(app)
      .post('/api/admin/figures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nom: 'Figure Test Validation',
        descriptif: 'Test',
        discipline_id: 1,
        etapes: [
          { titre: 'Étape 1', description: 'Desc 1', xp: 10, ordre: 1 },
          { titre: 'Étape 2', description: 'Desc 2', xp: 15, ordre: 2 },
          { titre: 'Étape 3', description: 'Desc 3', xp: 20, ordre: 3 }
        ]
      });

    figureId = figureRes.body.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('✅ Professeur peut valider toutes les étapes d\'une figure pour son élève', async () => {
    const res = await request(app)
      .post(`/api/prof/validation/eleves/${eleveId}/figures/${figureId}`)
      .set('Authorization', `Bearer ${profToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('validée avec succès');
    expect(res.body.summary.total_etapes).toBe(3);
    expect(res.body.etapes_validees).toHaveLength(3);

    // Vérifier que les progressions ont été créées
    const progressions = await ProgressionEtape.findAll({
      where: { utilisateur_id: eleveId },
      include: [{
        model: EtapeProgression,
        as: 'etape',
        include: [{
          model: Figure,
          as: 'figure',
          where: { id: figureId }
        }]
      }]
    });

    expect(progressions).toHaveLength(3);
    progressions.forEach(p => {
      expect(p.statut).toBe('valide');
      expect(p.valide_par_prof_id).toBe(profId);
      expect(p.decay_level).toBe('fresh');
    });
  });

  test('✅ Admin peut valider pour n\'importe quel élève (sans relation)', async () => {
    // Créer un autre élève sans relation avec prof
    const autreEleveRes = await request(app)
      .post('/api/utilisateurs/register')
      .send({
        pseudo: 'autre_eleve',
        email: 'autre@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });
    const autreEleveId = autreEleveRes.body.user.id;

    const res = await request(app)
      .post(`/api/prof/validation/eleves/${autreEleveId}/figures/${figureId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.summary.total_etapes).toBe(3);
  });

  test('❌ Professeur ne peut pas valider pour un élève qui ne lui est pas assigné', async () => {
    // Créer un élève non lié au prof
    const nonLieRes = await request(app)
      .post('/api/utilisateurs/register')
      .send({
        pseudo: 'non_lie',
        email: 'nonlie@test.com',
        mot_de_passe: 'Password123!',
        role: 'eleve'
      });
    const nonLieId = nonLieRes.body.user.id;

    const res = await request(app)
      .post(`/api/prof/validation/eleves/${nonLieId}/figures/${figureId}`)
      .set('Authorization', `Bearer ${profToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('ne fait pas partie de vos élèves');
  });

  test('❌ Figure inexistante retourne 404', async () => {
    const res = await request(app)
      .post(`/api/prof/validation/eleves/${eleveId}/figures/99999`)
      .set('Authorization', `Bearer ${profToken}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Figure non trouvée');
  });

  test('❌ IDs invalides retournent 400', async () => {
    const res = await request(app)
      .post('/api/prof/validation/eleves/abc/figures/xyz')
      .set('Authorization', `Bearer ${profToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('IDs invalides');
  });

  test('✅ Mise à jour si progression existe déjà', async () => {
    // Créer une progression existante
    const etape = await EtapeProgression.findOne({
      include: [{
        model: Figure,
        as: 'figure',
        where: { id: figureId }
      }]
    });

    await ProgressionEtape.create({
      utilisateur_id: eleveId,
      etape_id: etape.id,
      statut: 'en_cours',
      lateralite: 'droite',
      decay_level: 'stale'
    });

    const res = await request(app)
      .post(`/api/prof/validation/eleves/${eleveId}/figures/${figureId}`)
      .set('Authorization', `Bearer ${profToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.summary.mises_a_jour).toBeGreaterThan(0);

    // Vérifier que la progression a été mise à jour
    const updated = await ProgressionEtape.findOne({
      where: {
        utilisateur_id: eleveId,
        etape_id: etape.id
      }
    });

    expect(updated.statut).toBe('valide');
    expect(updated.decay_level).toBe('fresh');
    expect(updated.valide_par_prof_id).toBe(profId);
  });

  test('❌ Sans authentification retourne 401', async () => {
    const res = await request(app)
      .post(`/api/prof/validation/eleves/${eleveId}/figures/${figureId}`)
      .send({});

    expect(res.status).toBe(401);
  });
});
