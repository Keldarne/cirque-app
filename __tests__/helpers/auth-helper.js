/**
 * Helper pour les tests d'authentification
 * Fournit des fonctions utilitaires pour se connecter et faire des requêtes authentifiées
 *
 * MULTI-TENANT UPDATE:
 * - Ajout de helpers pour créer des écoles de test
 * - Ajout de helpers pour créer des users avec ecole_id
 * - Tests doivent être exécutés après seed multi-tenant (npm run seed)
 */
const axios = require('axios');

// URL de base de l'API (ajustez selon votre configuration)
const API_BASE_URL = process.env.API_URL || 'http://localhost:4000/api';

/**
 * Crée une instance axios avec l'URL de base
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true // Ne pas rejeter les erreurs HTTP
});

/**
 * Connexion d'un utilisateur et récupération de son token
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<{token: string, user: Object}>}
 */
async function login(email, password) {
  const response = await api.post('/utilisateurs/login', {
    email,
    mot_de_passe: password
  });

  console.log('Raw Login Response:', response.status, response.data); // Debug print

  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.data.error || 'Unknown error'}`);
  }

  return {
    token: response.data.token,
    user: response.data.user
  };
}

/**
 * Connexion avec les comptes de test prédéfinis
 *
 * IMPORTANT: Ces comptes doivent être créés via le seed multi-tenant.
 * Exécutez `npm run reset-db && npm run seed` avant les tests.
 */
const loginAs = {
  admin: () => login('admin@cirqueapp.com', 'Admin123!'),
  professeur: () => login('jean.martin@voltige.fr', 'Password123!'),
  user: () => login('lucas.moreau@voltige.fr', 'Password123!')
};

/**
 * Fait une requête authentifiée avec un token
 * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
 * @param {string} url - URL de la route
 * @param {string} token - Token JWT
 * @param {Object} data - Données à envoyer (pour POST, PUT)
 * @returns {Promise<Object>} - Réponse axios
 */
async function authenticatedRequest(method, url, token, data = null) {
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.data = data;
  }

  return await api(config);
}

/**
 * Helpers pour les requêtes authentifiées
 */
const authRequest = {
  get: (url, token) => authenticatedRequest('GET', url, token),
  post: (url, token, data) => authenticatedRequest('POST', url, token, data),
  put: (url, token, data) => authenticatedRequest('PUT', url, token, data),
  delete: (url, token) => authenticatedRequest('DELETE', url, token)
};

/**
 * Requêtes non authentifiées (sans token)
 */
const publicRequest = {
  get: (url) => api.get(url),
  post: (url, data) => api.post(url, data),
  put: (url, data) => api.put(url, data),
  delete: (url) => api.delete(url)
};

/**
 * Attend que le serveur soit disponible
 * @param {number} maxAttempts - Nombre maximum de tentatives
 * @param {number} delay - Délai entre les tentatives (ms)
 */
async function waitForServer(maxAttempts = 30, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await api.get('/disciplines');
      console.log('✅ Serveur disponible');
      return true;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error('❌ Serveur non disponible après ' + maxAttempts + ' tentatives');
      }
      console.log(`⏳ Attente du serveur... (tentative ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Données de test pour créer des figures, disciplines, écoles
 */
const testData = {
  figure: {
    nom: 'Figure de test',
    descriptif: 'Description de test',
    discipline_id: 1,
    etapes: [
      {
        titre: 'Étape 1',
        description: 'Description étape 1',
        xp: 10
      },
      {
        titre: 'Étape 2',
        description: 'Description étape 2',
        xp: 15
      }
    ]
  },
  discipline: {
    nom: 'Discipline de test'
  },
  // Multi-tenant: École de test
  ecole: {
    nom: 'École de Test',
    slug: 'ecole-test',
    plan: 'basic',
    type_facturation: 'mensuel',
    statut_abonnement: 'actif',
    montant_mensuel: 29.00,
    max_eleves: 50,
    max_professeurs: 3,
    max_stockage_gb: 10,
    actif: true
  }
};

/**
 * Créer une école de test (Multi-Tenant)
 * IMPORTANT: Requiert route POST /admin/ecoles (à implémenter)
 * @param {string} adminToken - Token admin
 * @param {Object} ecoleData - Données de l'école (optionnel)
 * @returns {Promise<Object>} École créée
 */
async function createTestEcole(adminToken, ecoleData = null) {
  const data = ecoleData || {
    ...testData.ecole,
    slug: `ecole-test-${Date.now()}` // Unique slug
  };

  const response = await authRequest.post('/admin/ecoles', adminToken, data);

  if (response.status !== 201) {
    throw new Error(`Failed to create test école: ${response.data.error || 'Unknown error'}`);
  }

  return response.data;
}

/**
 * Créer un utilisateur de test lié à une école
 * @param {Object} userData - Données utilisateur { nom, prenom, email, role, mot_de_passe }
 * @param {number} ecoleId - ID de l'école (null pour solo user)
 * @returns {Promise<{token: string, user: Object}>}
 */
async function createTestUser(userData, ecoleId = null) {
  const email = userData.email || `test${Date.now()}@test.fr`;
  const password = userData.mot_de_passe || 'Password123!';

  const response = await api.post('/register', {
    nom: userData.nom || 'Test',
    prenom: userData.prenom || 'User',
    email,
    mot_de_passe: password,
    role: userData.role || 'eleve',
    ecole_id: ecoleId  // Multi-tenant: NULL pour solo, sinon ID école
  });

  if (response.status !== 201) {
    throw new Error(`Failed to create test user: ${response.data.error || 'Unknown error'}`);
  }

  // Login automatique après création
  return login(email, password);
}

/**
 * Créer une figure de test avec ecole_id
 * @param {string} profToken - Token professeur
 * @param {Object} figureData - Données figure (optionnel)
 * @param {number} ecoleId - ID école (NULL pour public)
 * @returns {Promise<Object>} Figure créée
 */
async function createTestFigure(profToken, figureData = null, ecoleId = null) {
  const data = figureData || {
    ...testData.figure,
    nom: `Figure Test ${Date.now()}`,
    ecole_id: ecoleId,
    visibilite: ecoleId ? 'ecole' : 'public'
  };

  const response = await authRequest.post('/admin/figures', profToken, data);

  if (response.status !== 201) {
    throw new Error(`Failed to create test figure: ${response.data.error || 'Unknown error'}`);
  }

  return response.data;
}

module.exports = {
  api,
  login,
  loginAs,
  authRequest,
  publicRequest,
  waitForServer,
  testData,
  // Multi-tenant helpers
  createTestEcole,
  createTestUser,
  createTestFigure,
  API_BASE_URL
};
