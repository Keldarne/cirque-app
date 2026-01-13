-- Migration 003: Ajout de la colonne metadata JSON au modèle Figure
-- Date: 2026-01-12
-- Objectif: Supporter des données spécifiques par discipline (jonglage, aérien, équilibre, etc.)
--
-- Exemples de metadata par discipline:
--
-- JONGLAGE:
-- {
--   "siteswap": "531",
--   "num_objects": 3,
--   "juggling_lab_compatible": true,
--   "object_types": ["balls", "clubs", "rings"]
-- }
--
-- AÉRIEN:
-- {
--   "apparatus": "tissu",
--   "height_meters": 6,
--   "rotations": 2,
--   "drop_height": 3
-- }
--
-- ÉQUILIBRE:
-- {
--   "tempo_seconds": 30,
--   "support_points": 2,
--   "apparatus": "boule"
-- }
--
-- ACROBATIE:
-- {
--   "flight_phase": true,
--   "rotation_type": "salto_avant",
--   "rotation_degrees": 360
-- }

-- ══════════════════════════════════════════════════════════════════
-- UP: Ajouter la colonne metadata
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE `Figures`
ADD COLUMN `metadata` JSON DEFAULT NULL
COMMENT 'Données spécifiques à la discipline (format JSON flexible)';

-- ══════════════════════════════════════════════════════════════════
-- ROLLBACK (si besoin de revert): Supprimer la colonne
-- ══════════════════════════════════════════════════════════════════

-- ALTER TABLE `Figures` DROP COLUMN `metadata`;

-- ══════════════════════════════════════════════════════════════════
-- NOTES:
-- ══════════════════════════════════════════════════════════════════

-- 1. MySQL 8.0 supporte JSON natif avec indexation et fonctions de requête
-- 2. Validation JSON côté application (pas de contrainte CHECK DB)
-- 3. Valeur NULL par défaut pour toutes les figures existantes
-- 4. Pas d'index JSON pour l'instant (à créer si besoin de requêtes sur metadata)
--
-- Exemple requête JSON (si besoin futur):
-- SELECT * FROM Figures WHERE JSON_EXTRACT(metadata, '$.siteswap') = '531';
-- CREATE INDEX idx_metadata_siteswap ON Figures ((CAST(metadata->>'$.siteswap' AS CHAR(10))));
