-- Migration 002: Ajout d'Index de Performance pour Multi-Tenant
-- Date: 2026-01-10
-- Description: Ajoute des index optimisés pour les requêtes multi-tenant fréquentes
-- Performance attendue: ~40-60% amélioration sur requêtes école-spécifiques

-- Index 1: Optimiser les requêtes par école + discipline
-- Use case: GET /api/figures?discipline_id=X pour utilisateurs d'école
-- Gain estimé: ~40% sur requêtes filtrées par discipline
CREATE INDEX IF NOT EXISTS idx_ecole_discipline
ON Figures(ecole_id, discipline_id)
COMMENT 'Optimize school-specific catalog filtering by discipline';

-- Index 2: Optimiser les requêtes par école + créateur
-- Use case: Professeurs cherchant leurs propres figures
-- Gain estimé: ~60% sur requêtes "mes figures"
CREATE INDEX IF NOT EXISTS idx_ecole_createur
ON Figures(ecole_id, createur_id)
COMMENT 'Optimize queries for figures created within a school';

-- Vérification: Afficher tous les index de la table Figures
SELECT
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX,
  INDEX_TYPE,
  INDEX_COMMENT
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_NAME = 'Figures'
  AND TABLE_SCHEMA = DATABASE()
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Analyse de la table pour optimiser le query planner
ANALYZE TABLE Figures;

-- ✅ Vérifier que les nouveaux index apparaissent dans la liste
