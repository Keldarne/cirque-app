/**
 * Utilitaire pour les appels API avec gestion automatique du token
 */

/**
 * Récupère le token depuis le localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * Effectue un appel fetch avec le token d'authentification
 * @param {string} url - URL de l'API (chemin relatif, ex: /utilisateurs/login)
 * @param {object} options - Options fetch (method, body, headers, etc.)
 * @returns {Promise} - Promesse de la réponse
 */
export const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();

  // Préparer les headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Ajouter le token si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const fullUrl = `${API_BASE_URL}${url}`;

  // Effectuer la requête
  const response = await fetch(fullUrl, {
    ...options,
    headers
  });

  return response;
};

/**
 * Helpers pour les méthodes HTTP courantes
 */
export const api = {
  get: (url) => fetchWithAuth(url, { method: 'GET' }),

  post: (url, data) => fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  put: (url, data) => fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (url) => fetchWithAuth(url, { method: 'DELETE' })
};

export default api;
