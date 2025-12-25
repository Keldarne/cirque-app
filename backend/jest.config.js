/**
 * Configuration Jest pour les tests de sécurité
 */
module.exports = {
  // Environnement de test
  testEnvironment: 'node',

  // Pattern pour trouver les fichiers de test
  testMatch: [
    '**/test/**/*.test.js'
  ],

  // Timeout pour les tests (30 secondes pour les tests API)
  testTimeout: 30000,

  // Affichage détaillé
  verbose: true,

  // Coverage (optionnel)
  collectCoverageFrom: [
    'src/routes/**/*.js',
    'src/middleware/**/*.js',
    '!node_modules/**'
  ],

  // Ignorer les node_modules
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ]
};
