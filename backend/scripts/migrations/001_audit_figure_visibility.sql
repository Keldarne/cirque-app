-- Migration 001: Audit et Correction de la Cohérence visibilite/ecole_id
-- Date: 2026-01-10
-- Description: Vérifie et corrige les incohérences entre ecole_id et visibilite dans la table Figures
-- IMPORTANT: Cette migration est idempotente (peut être exécutée plusieurs fois sans risque)

-- Étape 1: Audit - Afficher les incohérences avant correction
SELECT
  'AUDIT AVANT CORRECTION' as etape,
  COUNT(*) as total_figures,
  SUM(CASE WHEN ecole_id IS NULL AND visibilite != 'public' THEN 1 ELSE 0 END) as null_not_public,
  SUM(CASE WHEN ecole_id IS NOT NULL AND visibilite != 'ecole' THEN 1 ELSE 0 END) as school_not_ecole,
  SUM(CASE WHEN
    (ecole_id IS NULL AND visibilite != 'public') OR
    (ecole_id IS NOT NULL AND visibilite != 'ecole')
  THEN 1 ELSE 0 END) as total_inconsistencies
FROM Figures;

-- Étape 2: Afficher détails des figures incohérentes (pour logging)
SELECT
  id,
  nom,
  ecole_id,
  visibilite,
  CASE
    WHEN ecole_id IS NULL AND visibilite != 'public' THEN 'ecole_id NULL mais visibilite != public'
    WHEN ecole_id IS NOT NULL AND visibilite != 'ecole' THEN 'ecole_id SET mais visibilite != ecole'
  END as type_incoherence
FROM Figures
WHERE
  (ecole_id IS NULL AND visibilite != 'public') OR
  (ecole_id IS NOT NULL AND visibilite != 'ecole');

-- Étape 3: Correction - Figures publiques (ecole_id NULL) doivent avoir visibilite='public'
UPDATE Figures
SET visibilite = 'public'
WHERE ecole_id IS NULL AND visibilite != 'public';

-- Étape 4: Correction - Figures d'école (ecole_id NOT NULL) doivent avoir visibilite='ecole'
UPDATE Figures
SET visibilite = 'ecole'
WHERE ecole_id IS NOT NULL AND visibilite != 'ecole';

-- Étape 5: Vérification finale - Doit retourner 0 incohérences
SELECT
  'AUDIT APRÈS CORRECTION' as etape,
  COUNT(*) as total_figures,
  SUM(CASE WHEN ecole_id IS NULL AND visibilite != 'public' THEN 1 ELSE 0 END) as null_not_public,
  SUM(CASE WHEN ecole_id IS NOT NULL AND visibilite != 'ecole' THEN 1 ELSE 0 END) as school_not_ecole,
  SUM(CASE WHEN
    (ecole_id IS NULL AND visibilite != 'public') OR
    (ecole_id IS NOT NULL AND visibilite != 'ecole')
  THEN 1 ELSE 0 END) as total_inconsistencies
FROM Figures;

-- ✅ Si total_inconsistencies = 0, la migration a réussi !
