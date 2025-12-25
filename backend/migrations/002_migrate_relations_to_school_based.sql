-- ============================================================================
-- Migration 002: Migrate Relations to School-Based Access
-- Date: 2025-12-15
-- Description:
--   - Auto-crée relations prof-élève pour tous élèves de même école
--   - Auto-accepte invitations en attente (plus besoin d'invitations)
--   - Nettoie codes invitation (plus utilisés)
-- ============================================================================

BEGIN;

-- 1. Auto-créer relations pour tous les profs et élèves de la même école
INSERT INTO "RelationProfEleve" (professeur_id, eleve_id, statut, date_acceptation, "createdAt", "updatedAt")
SELECT DISTINCT
    prof.id AS professeur_id,
    eleve.id AS eleve_id,
    'accepte' AS statut,
    CURRENT_TIMESTAMP AS date_acceptation,
    CURRENT_TIMESTAMP AS "createdAt",
    CURRENT_TIMESTAMP AS "updatedAt"
FROM "Utilisateurs" prof
INNER JOIN "Utilisateurs" eleve ON prof.ecole_id = eleve.ecole_id
WHERE prof.role = 'professeur'
  AND eleve.role IN ('eleve', 'standard')
  AND prof.ecole_id IS NOT NULL
ON CONFLICT (professeur_id, eleve_id) DO NOTHING;

-- 2. Auto-accepter toutes les invitations en attente ou refusées
UPDATE "RelationProfEleve"
SET statut = 'accepte',
    date_acceptation = CURRENT_TIMESTAMP,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE statut IN ('en_attente', 'refuse');

-- 3. Nettoyer les codes invitation (plus utilisés avec système école)
UPDATE "RelationProfEleve"
SET code_invitation = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE code_invitation IS NOT NULL;

COMMIT;

-- ============================================================================
-- Notes:
-- ============================================================================
-- Cette migration transforme le système d'invitations en système basé sur l'école:
--   - Professeurs avec ecole_id voient automatiquement tous élèves de leur école
--   - Professeurs sans ecole_id gardent leurs relations existantes (fallback)
--   - Plus besoin de codes invitation
--   - Toutes relations passent à statut 'accepte'
--
-- Rollback: Impossible de rollback proprement car on perd l'info des codes
-- d'invitation et des statuts d'origine. Restaurer depuis backup si nécessaire.
-- ============================================================================
