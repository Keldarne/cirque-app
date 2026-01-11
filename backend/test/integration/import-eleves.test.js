/**
 * Tests d'intégration pour l'import d'élèves en masse
 */

const request = require('supertest');
const app = require('../../server');
const { Utilisateur, Ecole } = require('../../src/models');
const { getAuthTokenForUser } = require('../helpers/auth-helper');
const fs = require('fs');
const path = require('path');
const ImportElevesService = require('../../src/services/ImportElevesService');

describe('Import d\'élèves en masse', () => {
  let tokenProf, tokenSchoolAdmin, tokenSolo, tokenAdmin;
  let ecoleVoltige, prof, schoolAdmin, soloUser, admin;

  beforeAll(async () => {
    // Récupérer les utilisateurs de test du seed
    admin = await Utilisateur.findOne({ where: { email: 'admin@cirqueapp.com' } });
    schoolAdmin = await Utilisateur.findOne({ where: { email: 'admin.voltige@voltige.fr' } });
    prof = await Utilisateur.findOne({ where: { email: 'jean.martin@voltige.fr' } });
    soloUser = await Utilisateur.findOne({ where: { ecole_id: null, role: 'eleve' } });

    // Tokens
    tokenAdmin = getAuthTokenForUser(admin);
    tokenSchoolAdmin = getAuthTokenForUser(schoolAdmin);
    tokenProf = getAuthTokenForUser(prof);
    if (soloUser) {
      tokenSolo = getAuthTokenForUser(soloUser);
    }

    // École Voltige
    ecoleVoltige = await Ecole.findOne({ where: { slug: 'ecole-voltige' } });
  });

  describe('ImportElevesService - Génération', () => {
    test('✅ Génération correcte du préfixe école', () => {
      expect(ImportElevesService.genererPrefixeEcole('École de Cirque Voltige')).toBe('vol');
      expect(ImportElevesService.genererPrefixeEcole('Académie des Arts du Cirque')).toBe('aca');
      expect(ImportElevesService.genererPrefixeEcole('Cirque du Soleil')).toBe('cir');
    });

    test('✅ Génération correcte du domaine', () => {
      expect(ImportElevesService.extraireDomaine('École de Cirque Voltige')).toBe('voltige');
      expect(ImportElevesService.extraireDomaine('Académie des Arts du Cirque')).toBe('academie');
    });

    test('✅ Génération correcte du pseudo', () => {
      const pseudo = ImportElevesService.genererPseudo('Lucas', 'Moreau', 'vol');
      expect(pseudo).toBe('vol-lucas.moreau');
    });

    test('✅ Génération pseudo avec accents normalisés', () => {
      const pseudo = ImportElevesService.genererPseudo('José', 'García', 'vol');
      expect(pseudo).toBe('vol-jose.garcia');
    });

    test('✅ Génération correcte de l\'email', () => {
      const email = ImportElevesService.genererEmail('Lucas', 'Moreau', 'voltige');
      expect(email).toBe('lucas.moreau@voltige.fr');
    });

    test('✅ Génération mot de passe par école', () => {
      const annee = new Date().getFullYear();
      expect(ImportElevesService.genererMotDePasseEcole('École de Cirque Voltige')).toBe(`Voltige${annee}!`);
      expect(ImportElevesService.genererMotDePasseEcole('Académie des Arts')).toBe(`Academie${annee}!`);
    });
  });

  describe('POST /api/prof/eleves/import', () => {
    // Créer un fichier CSV temporaire pour les tests
    const createTempCSV = (data) => {
      const tempPath = path.join(__dirname, `../fixtures/temp-${Date.now()}.csv`);
      fs.writeFileSync(tempPath, data);
      return tempPath;
    };

    const cleanupTempFiles = () => {
      const fixturesDir = path.join(__dirname, '../fixtures');
      const tempFiles = fs.readdirSync(fixturesDir).filter(f => f.startsWith('temp-'));
      tempFiles.forEach(f => {
        fs.unlinkSync(path.join(fixturesDir, f));
      });
    };

    afterEach(() => {
      cleanupTempFiles();
    });

    test('✅ Import CSV valide avec 3 élèves', async () => {
      const csvData = 'Prénom,Nom\nMaxime,Test1\nCamille,Test2\nHugo,Test3';
      const csvPath = createTempCSV(csvData);

      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.created).toBe(3);
      expect(res.body.failed).toBe(0);
      expect(res.body.defaultPassword).toContain('Voltige');
      expect(res.body.prefixePseudo).toBe('vol');

      // Vérifier que les élèves ont été créés
      const maxime = await Utilisateur.findOne({ where: { pseudo: 'vol-maxime.test1' } });
      expect(maxime).toBeTruthy();
      expect(maxime.nom).toBe('Test1');
      expect(maxime.prenom).toBe('Maxime');
      expect(maxime.ecole_id).toBe(prof.ecole_id);
      expect(maxime.role).toBe('eleve');

      // Cleanup
      await Utilisateur.destroy({ where: { pseudo: { [require('sequelize').Op.like]: 'vol-%.test%' } } });
    });

    test('✅ Import avec email fourni dans CSV', async () => {
      const csvData = 'Prénom,Nom,Email\nLéa,TestEmail,lea.testemail@parent.fr';
      const csvPath = createTempCSV(csvData);

      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath);

      expect(res.status).toBe(201);
      expect(res.body.created).toBe(1);

      const lea = await Utilisateur.findOne({ where: { pseudo: 'vol-lea.testemail' } });
      expect(lea).toBeTruthy();
      expect(lea.email).toBe('lea.testemail@parent.fr'); // Email fourni, pas généré

      // Cleanup
      await lea.destroy();
    });

    test('✅ Login avec pseudo généré fonctionne', async () => {
      // D'abord importer un élève
      const csvData = 'Prénom,Nom\nTestLogin,User';
      const csvPath = createTempCSV(csvData);

      const importRes = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath);

      expect(importRes.status).toBe(201);
      const motDePasse = importRes.body.defaultPassword;

      // Tester le login avec le pseudo généré
      const loginRes = await request(app)
        .post('/api/utilisateurs/login')
        .send({
          pseudo: 'vol-testlogin.user',
          mot_de_passe: motDePasse
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeTruthy();
      expect(loginRes.body.utilisateur.pseudo).toBe('vol-testlogin.user');

      // Cleanup
      await Utilisateur.destroy({ where: { pseudo: 'vol-testlogin.user' } });
    });

    test('❌ Rejet si utilisateur solo (sans école)', async () => {
      if (!soloUser) {
        console.warn('⚠️ Pas d\'utilisateur solo dans seed, skip test');
        return;
      }

      const csvData = 'Prénom,Nom\nTest,Solo';
      const csvPath = createTempCSV(csvData);

      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenSolo}`)
        .attach('file', csvPath);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('affiliés à une école');
    });

    test('❌ Rejet si fichier non fourni', async () => {
      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('CSV requis');
    });

    test('❌ Rejet si CSV vide', async () => {
      const csvData = 'Prénom,Nom';
      const csvPath = createTempCSV(csvData);

      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('vide');
    });

    test('❌ Rejet si pseudo existe déjà', async () => {
      // Créer un premier élève
      const csvData1 = 'Prénom,Nom\nDupli,Cate';
      const csvPath1 = createTempCSV(csvData1);

      const res1 = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath1);

      expect(res1.status).toBe(201);

      // Tenter de créer le même élève
      const csvData2 = 'Prénom,Nom\nDupli,Cate';
      const csvPath2 = createTempCSV(csvData2);

      const res2 = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath2);

      expect(res2.status).toBe(409);
      expect(res2.body.error).toContain('existants');

      // Cleanup
      await Utilisateur.destroy({ where: { pseudo: 'vol-dupli.cate' } });
    });

    test('❌ Rejet si doublons dans CSV lui-même', async () => {
      const csvData = 'Prénom,Nom\nSame,Person\nSame,Person';
      const csvPath = createTempCSV(csvData);

      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Doublons');
    });

    test('❌ Rejet si plus de 100 élèves', async () => {
      // Générer un CSV avec 101 élèves
      let csvData = 'Prénom,Nom\n';
      for (let i = 1; i <= 101; i++) {
        csvData += `Eleve${i},Nom${i}\n`;
      }
      const csvPath = createTempCSV(csvData);

      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Maximum 100');
    });

    test('❌ Rejet si limite école dépassée', async () => {
      // École Voltige a max 50 élèves
      // Compter les élèves actuels
      const currentCount = await Utilisateur.count({
        where: { ecole_id: ecoleVoltige.id, role: 'eleve' }
      });

      const remaining = ecoleVoltige.max_eleves - currentCount;

      if (remaining > 0) {
        // Tenter d'importer plus que la limite restante
        let csvData = 'Prénom,Nom\n';
        for (let i = 1; i <= remaining + 5; i++) {
          csvData += `LimiteTest${i},Nom${i}\n`;
        }
        const csvPath = createTempCSV(csvData);

        const res = await request(app)
          .post('/api/prof/eleves/import')
          .set('Authorization', `Bearer ${tokenProf}`)
          .attach('file', csvPath);

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('limite');
      } else {
        console.warn('⚠️ École déjà à la limite, skip test');
      }
    });

    test('❌ Rejet si nom trop court', async () => {
      const csvData = 'Prénom,Nom\nA,B';
      const csvPath = createTempCSV(csvData);

      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenProf}`)
        .attach('file', csvPath);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Erreurs');
    });

    test('✅ School admin peut aussi importer', async () => {
      const csvData = 'Prénom,Nom\nAdminTest,Import';
      const csvPath = createTempCSV(csvData);

      const res = await request(app)
        .post('/api/prof/eleves/import')
        .set('Authorization', `Bearer ${tokenSchoolAdmin}`)
        .attach('file', csvPath);

      expect(res.status).toBe(201);
      expect(res.body.created).toBe(1);

      // Cleanup
      await Utilisateur.destroy({ where: { pseudo: 'vol-admintest.import' } });
    });
  });

  describe('Validation des données', () => {
    test('✅ Validation prénom valide', () => {
      const error = ImportElevesService.validerDonneesEleve({ prenom: 'Lucas', nom: 'Moreau' }, 0);
      expect(error).toBeNull();
    });

    test('❌ Validation prénom trop court', () => {
      const error = ImportElevesService.validerDonneesEleve({ prenom: 'L', nom: 'Moreau' }, 0);
      expect(error).toBeTruthy();
      expect(error.error).toContain('Prénom');
    });

    test('❌ Validation nom trop court', () => {
      const error = ImportElevesService.validerDonneesEleve({ prenom: 'Lucas', nom: 'M' }, 0);
      expect(error).toBeTruthy();
      expect(error.error).toContain('Nom');
    });

    test('❌ Validation email invalide', () => {
      const error = ImportElevesService.validerDonneesEleve({
        prenom: 'Lucas',
        nom: 'Moreau',
        email: 'invalid-email'
      }, 0);
      expect(error).toBeTruthy();
      expect(error.error).toContain('email');
    });
  });
});
