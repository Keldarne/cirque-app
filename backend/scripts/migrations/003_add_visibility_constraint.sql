-- Migration 003: Ajout Contrainte de Cohérence visibilite/ecole_id (OPTIONNEL)
-- Date: 2026-01-10
-- Description: Ajoute une contrainte CHECK pour garantir la cohérence données au niveau DB
-- ATTENTION: Requiert MySQL 8.0.16+ pour support CHECK constraints
-- NOTE: Cette migration est OPTIONNELLE car validation déjà faite au niveau modèle Sequelize

-- Vérification de la version MySQL
SELECT
  VERSION() as mysql_version,
  CASE
    WHEN VERSION() >= '8.0.16' THEN '✅ Compatible avec CHECK constraints'
    ELSE '⚠️ Version < 8.0.16 - CHECK constraints non supportées'
  END as compatibility_status;

-- Ajout de la contrainte (seulement si MySQL 8.0.16+)
-- Cette contrainte garantit au niveau DB que:
-- - ecole_id NULL => visibilite = 'public'
-- - ecole_id NOT NULL => visibilite = 'ecole'

-- DÉCOMMENTER LA LIGNE SUIVANTE SI MYSQL >= 8.0.16:
-- ALTER TABLE Figures
-- ADD CONSTRAINT chk_visibilite_consistency
-- CHECK (
--   (ecole_id IS NULL AND visibilite = 'public') OR
--   (ecole_id IS NOT NULL AND visibilite = 'ecole')
-- );

-- Vérification des contraintes existantes
SELECT
  CONSTRAINT_NAME,
  CONSTRAINT_TYPE,
  TABLE_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_NAME = 'Figures'
  AND TABLE_SCHEMA = DATABASE();

-- Rollback (si nécessaire):
-- ALTER TABLE Figures DROP CONSTRAINT chk_visibilite_consistency;

-- ✅ Note: La validation au niveau modèle Sequelize (Figure.js) suffit pour la plupart des cas
-- Cette contrainte DB est une couche de sécurité supplémentaire optionnelle
