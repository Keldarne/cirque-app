-- ============================================================================
-- Migration 001: Add Group Programme Assignment
-- Date: 2025-12-15
-- Description:
--   - Crée la table AssignationsGroupeProgramme pour assigner des programmes à des groupes
--   - Ajoute colonnes source_type et source_groupe_id à AssignationsProgramme
--   - Ajoute indexes pour performance
-- ============================================================================

BEGIN;

-- 1. Créer la nouvelle table AssignationsGroupeProgramme
CREATE TABLE IF NOT EXISTS "AssignationsGroupeProgramme" (
    id SERIAL PRIMARY KEY,
    groupe_id INTEGER NOT NULL REFERENCES "Groupes"(id) ON DELETE CASCADE,
    programme_id INTEGER NOT NULL REFERENCES "ProgrammesProf"(id) ON DELETE CASCADE,
    date_assignation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Contrainte unique: un programme ne peut être assigné qu'une fois à un groupe
    CONSTRAINT unique_groupe_programme UNIQUE(groupe_id, programme_id)
);

-- 2. Créer les indexes pour performance
CREATE INDEX IF NOT EXISTS idx_agp_groupe ON "AssignationsGroupeProgramme"(groupe_id);
CREATE INDEX IF NOT EXISTS idx_agp_programme ON "AssignationsGroupeProgramme"(programme_id);

-- 3. Ajouter les nouvelles colonnes à la table AssignationsProgramme
ALTER TABLE "AssignationsProgramme"
ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'direct'
    CHECK (source_type IN ('direct', 'groupe'));

ALTER TABLE "AssignationsProgramme"
ADD COLUMN IF NOT EXISTS source_groupe_id INTEGER REFERENCES "Groupes"(id) ON DELETE SET NULL;

-- 4. Créer index pour optimiser les requêtes sur source_type et source_groupe_id
CREATE INDEX IF NOT EXISTS idx_ap_source ON "AssignationsProgramme"(source_type, source_groupe_id);

-- 5. Créer index sur ecole_id dans Utilisateurs pour performance des requêtes école-based
CREATE INDEX IF NOT EXISTS idx_utilisateur_ecole ON "Utilisateurs"(ecole_id) WHERE ecole_id IS NOT NULL;

-- 6. Mettre à jour les assignations existantes avec source_type='direct'
UPDATE "AssignationsProgramme"
SET source_type = 'direct'
WHERE source_type IS NULL;

COMMIT;

-- ============================================================================
-- Rollback Instructions (à exécuter manuellement si besoin):
-- ============================================================================
-- BEGIN;
-- DROP INDEX IF EXISTS idx_utilisateur_ecole;
-- DROP INDEX IF EXISTS idx_ap_source;
-- ALTER TABLE "AssignationsProgramme" DROP COLUMN IF EXISTS source_groupe_id;
-- ALTER TABLE "AssignationsProgramme" DROP COLUMN IF EXISTS source_type;
-- DROP INDEX IF EXISTS idx_agp_programme;
-- DROP INDEX IF EXISTS idx_agp_groupe;
-- DROP TABLE IF EXISTS "AssignationsGroupeProgramme";
-- COMMIT;
