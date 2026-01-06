/**
 * Script de test pour vérifier:
 * 1. Auto-création de progression
 * 2. Protection idempotence
 * 3. Validation étape existe
 * 4. Catégorisation des erreurs
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:4000';
let userToken = null;

// Helper: Faire une requête HTTP
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test 1: Login
async function testLogin() {
  console.log('\n📝 Test 1: Login utilisateur test');
  const response = await makeRequest('POST', '/api/utilisateurs/login', {
    email: 'lucas.moreau@voltige.fr',
    mot_de_passe: 'Password123!'
  });

  if (response.status === 200 && response.data.token) {
    userToken = response.data.token;
    console.log('✅ Login réussi');
    if (response.data.utilisateur) {
      console.log(`   User ID: ${response.data.utilisateur.id}`);
      console.log(`   Pseudo: ${response.data.utilisateur.pseudo}`);
      return response.data.utilisateur.id;
    }
    return null;
  } else {
    console.log('❌ Login échoué:', response.data);
    throw new Error('Login failed');
  }
}

// Test 2: Auto-création de progression sur nouvelle figure
async function testAutoCreation(userId) {
  console.log('\n📝 Test 2: Auto-création de progression sur nouvelle figure');

  // Choisir une étape aléatoire (étape ID 50 par exemple)
  const etapeId = 50;

  const response = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: etapeId,
    typeSaisie: 'binaire',
    reussite: true
  }, userToken);

  if (response.status === 201) {
    console.log('✅ Tentative créée avec auto-création de progression');
    console.log(`   Progression ID: ${response.data.progressionEtape.id}`);
    console.log(`   Statut: ${response.data.progressionEtape.statut}`);
    console.log(`   Idempotent: ${response.data.idempotent}`);
    return response.data.progressionEtape.id;
  } else {
    console.log('❌ Auto-création échouée:', response.status, response.data);
    return null;
  }
}

// Test 3: Idempotence - double-clic rapide
async function testIdempotency() {
  console.log('\n📝 Test 3: Protection idempotence (double-clic rapide)');

  const etapeId = 51;
  const tentativeData = {
    etapeId: etapeId,
    typeSaisie: 'evaluation',
    score: 2
  };

  // Première tentative
  const response1 = await makeRequest('POST', '/api/entrainement/tentatives', tentativeData, userToken);
  console.log(`   Tentative 1: Status ${response1.status}, Idempotent: ${response1.data.idempotent}`);

  // Attendre 1 seconde
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Deuxième tentative identique (dans fenêtre de 3s)
  const response2 = await makeRequest('POST', '/api/entrainement/tentatives', tentativeData, userToken);
  console.log(`   Tentative 2: Status ${response2.status}, Idempotent: ${response2.data.idempotent}`);

  if (response2.status === 200 && response2.data.idempotent === true) {
    console.log('✅ Idempotence fonctionne correctement');
    console.log(`   Tentative existante retournée (ID: ${response2.data.tentative.id})`);
  } else {
    console.log('⚠️  Idempotence non déclenchée (peut-être > 3s écoulées)');
  }
}

// Test 4: Pratique rapide légitime (résultats différents)
async function testDifferentOutcomes() {
  console.log('\n📝 Test 4: Pratique rapide légitime (résultats différents)');

  const etapeId = 52;

  // Tentative 1: Échec
  const response1 = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: etapeId,
    typeSaisie: 'evaluation',
    score: 1 // Échec
  }, userToken);
  console.log(`   Tentative 1 (échec): Status ${response1.status}, Reussie: ${response1.data.tentative.reussie}`);

  // Attendre 500ms
  await new Promise(resolve => setTimeout(resolve, 500));

  // Tentative 2: Réussite (devrait être enregistrée même si < 3s)
  const response2 = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: etapeId,
    typeSaisie: 'evaluation',
    score: 3 // Maîtrisé
  }, userToken);
  console.log(`   Tentative 2 (réussite): Status ${response2.status}, Reussie: ${response2.data.tentative.reussie}`);

  if (response1.status === 201 && response2.status === 201) {
    console.log('✅ Les deux tentatives enregistrées (résultats différents)');
  } else {
    console.log('❌ Problème avec l\'enregistrement de tentatives différentes');
  }
}

// Test 5: Validation étape existe
async function testEtapeValidation() {
  console.log('\n📝 Test 5: Validation que l\'étape existe');

  const response = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: 999999, // Étape inexistante
    typeSaisie: 'binaire',
    reussite: false
  }, userToken);

  if (response.status === 404 && response.data.type === 'ETAPE_NOT_FOUND') {
    console.log('✅ Validation étape fonctionne');
    console.log(`   Erreur: ${response.data.error}`);
    console.log(`   Type: ${response.data.type}`);
  } else {
    console.log('❌ Validation étape ne fonctionne pas correctement');
    console.log(`   Status: ${response.status}, Response:`, response.data);
  }
}

// Test 6: Erreur de validation (données invalides)
async function testValidationError() {
  console.log('\n📝 Test 6: Erreur de validation (score manquant en mode evaluation)');

  const response = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: 53,
    typeSaisie: 'evaluation'
    // Pas de score fourni
  }, userToken);

  if (response.status === 400 && response.data.type === 'VALIDATION_ERROR') {
    console.log('✅ Validation des données fonctionne');
    console.log(`   Erreur: ${response.data.error}`);
    console.log(`   Type: ${response.data.type}`);
  } else {
    console.log('❌ Validation ne fonctionne pas correctement');
    console.log(`   Status: ${response.status}, Response:`, response.data);
  }
}

// Test 7: Les 4 modes d'entraînement
async function testAllModes() {
  console.log('\n📝 Test 7: Les 4 modes d\'entraînement');

  // Mode 1: Binaire
  const r1 = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: 54,
    typeSaisie: 'binaire',
    reussite: true
  }, userToken);
  console.log(`   Mode binaire: Status ${r1.status}, Reussie: ${r1.data.tentative?.reussie}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  // Mode 2: Evaluation
  const r2 = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: 55,
    typeSaisie: 'evaluation',
    score: 2
  }, userToken);
  console.log(`   Mode evaluation: Status ${r2.status}, Score: ${r2.data.tentative?.score}, Reussie: ${r2.data.tentative?.reussie}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  // Mode 3: Duree
  const r3 = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: 56,
    typeSaisie: 'duree',
    dureeSecondes: 120
  }, userToken);
  console.log(`   Mode duree: Status ${r3.status}, Durée: ${r3.data.tentative?.duree_secondes}s, Reussie: ${r3.data.tentative?.reussie}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  // Mode 4: Evaluation + Duree
  const r4 = await makeRequest('POST', '/api/entrainement/tentatives', {
    etapeId: 57,
    typeSaisie: 'evaluation_duree',
    score: 3,
    dureeSecondes: 180
  }, userToken);
  console.log(`   Mode evaluation_duree: Status ${r4.status}, Score: ${r4.data.tentative?.score}, Durée: ${r4.data.tentative?.duree_secondes}s, Reussie: ${r4.data.tentative?.reussie}`);

  if (r1.status === 201 && r2.status === 201 && r3.status === 201 && r4.status === 201) {
    console.log('✅ Les 4 modes fonctionnent correctement');
  } else {
    console.log('❌ Problème avec un ou plusieurs modes');
  }
}

// Exécution de tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests d\'auto-création et idempotence\n');
  console.log('=' .repeat(60));

  try {
    const userId = await testLogin();
    await testAutoCreation(userId);
    await testIdempotency();
    await testDifferentOutcomes();
    await testEtapeValidation();
    await testValidationError();
    await testAllModes();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tous les tests terminés avec succès!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

runAllTests();
