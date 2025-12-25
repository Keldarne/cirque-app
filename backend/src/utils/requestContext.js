const { AsyncLocalStorage } = require('async_hooks');

const localStorage = new AsyncLocalStorage();

/**
 * Middleware pour initialiser le contexte de la requête.
 * Permet d'accéder aux informations de l'utilisateur (y compris ecole_id)
 * dans les hooks Sequelize et les scopes par défaut.
 * Doit être placé APRÈS le middleware d'authentification (`verifierToken`).
 */
const requestContextMiddleware = (req, res, next) => {
  const store = new Map();
  if (req.user) {
    store.set('user', req.user);
  }
  localStorage.run(store, () => next());
};

/**
 * Récupère le contexte utilisateur actuel (req.user)
 * Utilisé dans les scopes Sequelize pour le filtrage multi-tenant.
 */
const getRequestContext = () => {
  const store = localStorage.getStore();
  return store ? store.get('user') : null;
};

module.exports = {
  requestContextMiddleware,
  getRequestContext,
  localStorage
};