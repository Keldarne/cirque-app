/**
 * Configuration globale pour tous les tests Jest
 * Définit les variables d'environnement nécessaires
 */

// Configuration pour les tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'cirque_app_test';
