# 🧪 TESTS MANUELS - REFONTE SYSTÈME INVITATIONS → ACCÈS ÉCOLE

**Date:** 15 Décembre 2025
**Objectif:** Valider la migration complète du système d'invitations vers l'accès automatique basé sur l'école + assignation de groupes

---

## 📋 RÉSUMÉ DES CHANGEMENTS IMPLÉMENTÉS

### ✅ Backend Complété

1. **Base de données**
   - ✅ Nouvelle table `AssignationsGroupeProgramme`
   - ✅ Colonnes `source_type` et `source_groupe_id` ajoutées à `AssignationsProgramme`
   - ✅ Indexes de performance créés
   - ✅ Migration des données existantes préparée

2. **Modèles Sequelize**
   - ✅ `models/AssignationGroupeProgramme.js` créé
   - ✅ `models/AssignationProgramme.js` mis à jour (source_type, source_groupe_id)
   - ✅ `models/index.js` mis à jour avec relations

3. **Services**
   - ✅ `services/GroupeProgrammeService.js` créé (assignation + propagation)
   - ✅ `services/ProfService.js` modifié (getElevesByEcole, fallback)
   - ✅ `services/ProgrammeService.js` modifié (assignerProgrammeUnifie)
   - ✅ `services/GroupeService.js` modifié (propagation auto)

4. **Routes API**
   - ✅ `POST /api/prof/programmes/:id/assigner` - Assignation unifiée
   - ✅ `GET /api/prof/programmes/:id/assignations` - Résumé assignations
   - ✅ `DELETE /api/prof/programmes/:id/groupes/:groupeId` - Retirer groupe
   - ✅ `routes/prof/invitations.js` - Retourne 410 Gone (déprécié)
   - ✅ `routes/prof/groupes.js` - Modifié pour accès école + propagation auto

### ✅ Frontend Complété

1. **Composants**
   - ✅ `components/prof/AssignProgramModalV2.js` créé (tabs Élèves/Groupes)
   - ✅ `components/prof/ProgrammeAssignationsView.js` créé (résumé assignations)

2. **Pages**
   - ✅ `pages/prof/ProgrammesPage.js` mis à jour (utilise AssignProgramModalV2)
   - ✅ `pages/prof/MesElevesPage.js` mis à jour (alerte info école)
   - ✅ `pages/prof/InvitationsPage.js` SUPPRIMÉ
   - ✅ `App.js` - Route /prof/invitations retirée

3. **Seed Data**
   - ✅ `seed/modules/seedRelations.js` réécrit (école-based)

---

## 🚀 ÉTAPES AVANT DE TESTER

### 1. Exécuter les Migrations Base de Données

```bash
# Depuis la racine du projet
node scripts/run-migrations.js
```

**Vérification:**
- Console affiche "Migration XXX.sql exécutée avec succès" pour les 2 fichiers
- Aucune erreur PostgreSQL
- Tables et colonnes créées correctement

### 2. Re-seed la Base de Données (Optionnel mais Recommandé)

```bash
npm run seed
```

**Vérification:**
- Création réussie des relations école-based
- Console affiche "X relations prof-élève créées (école-based)"
- Groupes créés avec élèves

### 3. Redémarrer le Backend

```bash
npm start
# ou
node server.js
```

**Vérification:**
- Serveur démarre sans erreur
- Modèles chargés correctement (pas d'erreur Sequelize)

### 4. Redémarrer le Frontend

```bash
cd frontend
npm start
```

**Vérification:**
- Aucune erreur de compilation
- Aucune erreur de module manquant

---

## 🧪 TESTS MANUELS À EFFECTUER (60 CAS)

### A. Accès Élèves par École (5 tests)

#### ✅ A1: Prof avec école voit TOUS élèves de l'école
**Comment tester:**
1. Se connecter en tant que professeur avec un `ecole_id`
2. Aller sur `/prof/eleves`
3. Vérifier que TOUS les élèves de l'école apparaissent
4. Vérifier le message "Tous les élèves de votre école sont automatiquement accessibles"

**Résultat attendu:** Tous les élèves de la même école visibles sans invitation

---

#### ✅ A2: Prof sans école voit seulement élèves avec RelationProfEleve
**Comment tester:**
1. Créer un prof sans `ecole_id` (ou utiliser un existant)
2. Se connecter avec ce prof
3. Aller sur `/prof/eleves`

**Résultat attendu:** Seulement les élèves avec relation active visibles (fallback)

---

#### ✅ A3: Nouveau élève dans école apparaît automatiquement
**Comment tester:**
1. Se connecter en tant que prof avec école
2. Noter le nombre d'élèves sur `/prof/eleves`
3. Créer un nouvel élève avec le même `ecole_id` (via admin ou seed)
4. Rafraîchir la page `/prof/eleves`

**Résultat attendu:** Le nouvel élève apparaît immédiatement sans action du prof

---

#### ✅ A4: Élèves autres écoles NON visibles
**Comment tester:**
1. Se connecter en tant que prof de l'école A
2. Vérifier les élèves visibles
3. Confirmer qu'aucun élève de l'école B n'apparaît

**Résultat attendu:** Isolation multi-tenant respectée (sécurité)

---

#### ✅ A5: Performance avec beaucoup d'élèves
**Comment tester:**
1. Créer une école avec 100+ élèves (via seed)
2. Se connecter en tant que prof de cette école
3. Chronomètrer le chargement de `/prof/eleves`

**Résultat attendu:** Chargement < 3 secondes

---

### B. Gestion Groupes (3 tests)

#### ✅ B1: Créer groupe avec nom + couleur
**Comment tester:**
1. Aller sur `/prof/groupes`
2. Cliquer "Créer un groupe"
3. Remplir nom, description, couleur
4. Enregistrer

**Résultat attendu:** Groupe créé et affiché dans la liste

---

#### ✅ B2: Ajouter élèves au groupe SANS vérification invitation
**Comment tester:**
1. Ouvrir un groupe existant
2. Ajouter plusieurs élèves de l'école
3. Vérifier aucune erreur "invitation requise"

**Résultat attendu:** Élèves ajoutés immédiatement (basé sur ecole_id)

---

#### ✅ B3: Retirer élève du groupe (garde accès prof)
**Comment tester:**
1. Retirer un élève d'un groupe
2. Vérifier que l'élève reste visible sur `/prof/eleves`
3. Vérifier qu'il garde les programmes assignés

**Résultat attendu:** Élève retiré du groupe mais toujours accessible

---

### C. Assignation Individuelle (4 tests)

#### ✅ C1: Assigner programme à 1 élève
**Comment tester:**
1. Aller sur `/prof/programmes`
2. Cliquer "Assigner" sur un programme
3. Onglet "Élèves" → Cocher 1 élève
4. Cliquer "Assigner"

**Résultat attendu:** Snackbar "Programme assigné avec succès"

---

#### ✅ C2: Assigner à 3+ élèves en même temps
**Comment tester:**
1. Ouvrir modal d'assignation
2. Onglet "Élèves" → Cocher 3+ élèves
3. Cliquer "Assigner"

**Résultat attendu:** Tous les élèves reçoivent le programme

---

#### ✅ C3: Élève déjà assigné affiché comme "Assigné"
**Comment tester:**
1. Assigner programme à un élève
2. Rouvrir le modal d'assignation du même programme
3. Vérifier que l'élève est coché + badge "Assigné"

**Résultat attendu:** Checkbox cochée + badge vert "Assigné"

---

#### ✅ C4: Désassigner élève
**Comment tester:**
1. Ouvrir modal, élève déjà assigné (coché)
2. Décocher l'élève
3. Cliquer "Assigner"

**Résultat attendu:** Élève perd l'assignation (à vérifier dans `/mon-programme` côté élève)

---

### D. Assignation Groupe (5 tests)

#### ✅ D1: Assigner programme à groupe → TOUS membres reçoivent
**Comment tester:**
1. Créer groupe avec 5 élèves
2. Assigner un programme à ce groupe
3. Vérifier que TOUS les 5 élèves ont le programme (via `/api/prof/programmes/:id/assignations`)

**Résultat attendu:** 5 assignations créées (source_type='groupe')

---

#### ✅ D2: Assigner à 2+ groupes simultanément
**Comment tester:**
1. Ouvrir modal d'assignation
2. Onglet "Groupes" → Cocher 2+ groupes
3. Cliquer "Assigner"

**Résultat attendu:** Tous les membres de tous les groupes reçoivent le programme

---

#### ✅ D3: Élève dans 2 groupes → 1 seule assignation
**Comment tester:**
1. Créer 2 groupes avec 1 élève commun
2. Assigner même programme aux 2 groupes
3. Vérifier qu'il y a 1 seule assignation pour l'élève commun

**Résultat attendu:** Constraint UNIQUE empêche le doublon

---

#### ✅ D4: Groupe vide → AssignationGroupeProgramme créée
**Comment tester:**
1. Créer un groupe sans membres
2. Assigner un programme à ce groupe vide
3. Vérifier dans DB: `AssignationsGroupeProgramme` existe
4. Vérifier: aucune assignation individuelle créée

**Résultat attendu:** Assignation groupe existe, pas d'assignations élèves

---

#### ✅ D5: Retirer groupe → Individus gardent programme
**Comment tester:**
1. Assigner programme à groupe
2. Vérifier que membres ont le programme
3. Retirer l'assignation du groupe
4. Vérifier que les élèves gardent individuellement le programme

**Résultat attendu:** AssignationGroupeProgramme supprimée, AssignationProgramme conservées

---

### E. Propagation Dynamique (4 tests)

#### ✅ E1: Ajouter élève à groupe APRÈS assignation → Reçoit programme auto
**Comment tester:**
1. Assigner programme à groupe
2. Ajouter un NOUVEAU élève au groupe
3. Vérifier que l'élève reçoit automatiquement le programme

**Résultat attendu:** AssignationProgramme créée automatiquement (source_type='groupe')

---

#### ✅ E2: Groupe a 3 programmes → Nouvel élève reçoit les 3
**Comment tester:**
1. Assigner 3 programmes à un groupe
2. Ajouter un nouvel élève au groupe
3. Vérifier que l'élève reçoit les 3 programmes

**Résultat attendu:** 3 assignations créées automatiquement

---

#### ✅ E3: Élève a déjà programme → Pas de doublon lors ajout groupe
**Comment tester:**
1. Assigner programme à élève (direct)
2. Assigner même programme à groupe
3. Ajouter l'élève au groupe
4. Vérifier qu'il n'y a pas de doublon

**Résultat attendu:** UNIQUE constraint empêche doublon, pas d'erreur visible

---

#### ✅ E4: Retirer élève du groupe → Garde le programme
**Comment tester:**
1. Élève dans groupe avec programme assigné
2. Retirer élève du groupe
3. Vérifier que l'élève garde le programme

**Résultat attendu:** AssignationProgramme conservée (pas de cascade delete)

---

### F. UI Modal (5 tests)

#### ✅ F1: Tabs "Élèves" / "Groupes" fonctionnent
**Comment tester:**
1. Ouvrir modal d'assignation
2. Cliquer sur tab "Groupes"
3. Vérifier affichage liste groupes
4. Revenir sur tab "Élèves"

**Résultat attendu:** Tabs switchent correctement, compteurs mis à jour

---

#### ✅ F2: Items assignés affichés cochés + badge "Assigné"
**Comment tester:**
1. Assigner programme à élève + groupe
2. Rouvrir modal
3. Vérifier checkboxes cochées
4. Vérifier badges "Assigné" visibles

**Résultat attendu:** État actuel correctement affiché

---

#### ✅ F3: Sélections préservées en switchant tabs
**Comment tester:**
1. Tab "Élèves" → cocher 2 élèves
2. Tab "Groupes" → cocher 1 groupe
3. Revenir tab "Élèves"
4. Vérifier que les 2 élèves sont toujours cochés

**Résultat attendu:** Sélections conservées entre tabs

---

#### ✅ F4: Search/filter fonctionne
**Comment tester:**
1. Tab "Élèves" → taper nom dans recherche
2. Vérifier filtrage
3. Faire pareil dans tab "Groupes"

**Résultat attendu:** Filtrage instantané fonctionne

---

#### ✅ F5: Couleurs groupes visibles
**Comment tester:**
1. Tab "Groupes"
2. Vérifier que chaque groupe a son cercle de couleur

**Résultat attendu:** Couleurs personnalisées affichées

---

### G. Page Détail Programme (4 tests)

#### ✅ G1: Section "Groupes assignés" affiche liste
**Comment tester:**
1. Assigner programme à 2 groupes
2. Aller sur `/prof/programmes/:id`
3. Vérifier section "Groupes assignés"

**Résultat attendu:** Liste des 2 groupes avec noms + couleurs

---

#### ✅ G2: Section "Élèves individuels" affiche que source_type='direct'
**Comment tester:**
1. Assigner programme à 1 élève direct + 1 groupe
2. Aller sur page détail programme
3. Vérifier que section "Élèves individuels" montre SEULEMENT l'élève direct

**Résultat attendu:** Élèves assignés via groupe non affichés dans section individuelle

---

#### ✅ G3: Stats compteurs corrects
**Comment tester:**
1. Assigner à 2 groupes (5 élèves chacun) + 3 élèves directs
2. Vérifier compteurs en haut de page

**Résultat attendu:** "2 Groupe(s)" + "13 Élève(s)" (ou similaire)

---

#### ✅ G4: Retirer groupe fonctionne
**Comment tester:**
1. Assigner programme à groupe
2. Page détail → cliquer "Retirer" sur le groupe
3. Confirmer
4. Vérifier que groupe disparaît de la liste

**Résultat attendu:** Groupe retiré, snackbar confirmation

---

### H. Edge Cases & Performance (5 tests)

#### ✅ H1: École 1000+ élèves → Modal charge en < 2s
**Comment tester:**
1. Seed école avec beaucoup d'élèves
2. Ouvrir modal d'assignation
3. Chronomètrer chargement

**Résultat attendu:** Pas de freeze, chargement rapide

---

#### ✅ H2: Prof sans élèves → Message vide clair
**Comment tester:**
1. Prof nouvelle école sans élèves
2. Aller sur `/prof/eleves`

**Résultat attendu:** "Aucun élève trouvé dans votre école pour le moment"

---

#### ✅ H3: Supprimer groupe → AssignationGroupeProgramme CASCADE deleted
**Comment tester:**
1. Assigner programme à groupe
2. Supprimer le groupe
3. Vérifier dans DB que AssignationGroupeProgramme est supprimée

**Résultat attendu:** Pas d'orphelins en DB

---

#### ✅ H4: Supprimer programme → Toutes assignations CASCADE deleted
**Comment tester:**
1. Assigner programme à élèves + groupes
2. Supprimer le programme
3. Vérifier DB: AssignationProgramme + AssignationGroupeProgramme supprimées

**Résultat attendu:** Cascade fonctionne, pas d'orphelins

---

#### ✅ H5: Assignations concurrentes (2 onglets) → Pas de conflit
**Comment tester:**
1. Ouvrir 2 onglets avec même compte prof
2. Assigner même programme à différents élèves depuis les 2 onglets
3. Vérifier pas d'erreur

**Résultat attendu:** Pas de conflit, UNIQUE constraint gère doublons

---

### I. Intégrité DB (4 tests)

#### ✅ I1: UNIQUE(groupe_id, programme_id) fonctionne
**Comment tester:**
1. Assigner programme à groupe
2. Tenter d'assigner même programme au même groupe via API directe

**Résultat attendu:** Erreur constraint violation

---

#### ✅ I2: UNIQUE(programme_id, eleve_id) fonctionne
**Comment tester:**
1. Assigner programme à élève
2. Tenter doublon via API

**Résultat attendu:** Erreur constraint violation

---

#### ✅ I3: CASCADE deletes fonctionnent
**Vérifier:**
- Supprimer groupe → AssignationGroupeProgramme supprimée
- Supprimer programme → Toutes assignations supprimées
- Supprimer élève → AssignationProgramme supprimées

**Résultat attendu:** Pas d'orphelins en DB

---

#### ✅ I4: source_type + source_groupe_id correctement remplis
**Comment tester:**
1. Assigner programme direct → vérifier DB: source_type='direct', source_groupe_id=NULL
2. Assigner via groupe → vérifier DB: source_type='groupe', source_groupe_id=ID

**Résultat attendu:** Données tracking correctes

---

### J. Migration & Compat (3 tests)

#### ✅ J1: Migration relations existantes → Tout en 'accepte'
**Comment tester:**
1. Vérifier DB: toutes RelationProfEleve ont statut='accepte'
2. Pas de statut='en_attente' ou 'refuse'

**Résultat attendu:** Migration complète réussie

---

#### ✅ J2: Codes invitation effacés (NULL)
**Comment tester:**
1. Vérifier DB: RelationProfEleve.code_invitation tous NULL

**Résultat attendu:** Champ nettoyé

---

#### ✅ J3: Routes /prof/invitations/* retournent 410 Gone
**Comment tester:**
1. Appeler `GET /api/prof/invitations` via Postman
2. Appeler `POST /api/prof/invitations`

**Résultat attendu:** HTTP 410 avec message explicatif

---

### K. Sécurité (3 tests)

#### ✅ K1: Prof école X ne peut pas assigner élève école Y
**Comment tester:**
1. Prof école A tente d'assigner programme à élève école B via API

**Résultat attendu:** HTTP 403 Forbidden

---

#### ✅ K2: Prof A ne peut pas assigner groupe de Prof B
**Comment tester:**
1. Prof A tente d'assigner un programme à un groupe créé par Prof B

**Résultat attendu:** HTTP 403 Forbidden

---

#### ✅ K3: Prof ne peut pas assigner programme d'un autre prof
**Comment tester:**
1. Prof A tente d'assigner un ProgrammeProf créé par Prof B

**Résultat attendu:** HTTP 403 ou 404

---

### L. Features Supprimées (3 tests)

#### ✅ L1: /prof/invitations retourne 410
**Déjà testé dans J3**

---

#### ✅ L2: Pas de lien "Invitations" dans menu
**Comment tester:**
1. Se connecter en tant que prof
2. Vérifier menu navigation

**Résultat attendu:** Lien "Invitations" n'existe plus

---

#### ✅ L3: Élèves ne voient pas UI "Accepter invitation"
**Comment tester:**
1. Se connecter en tant qu'élève
2. Vérifier pas de page/modal d'invitations

**Résultat attendu:** UI invitations complètement supprimée côté élève

---

## 📊 RÉSUMÉ DES TESTS

| Catégorie | Tests | Priorité |
|-----------|-------|----------|
| A. Accès École | 5 | ⭐⭐⭐ CRITIQUE |
| B. Gestion Groupes | 3 | ⭐⭐⭐ CRITIQUE |
| C. Assignation Individuelle | 4 | ⭐⭐⭐ CRITIQUE |
| D. Assignation Groupe | 5 | ⭐⭐⭐ CRITIQUE |
| E. Propagation | 4 | ⭐⭐⭐ CRITIQUE |
| F. UI Modal | 5 | ⭐⭐ IMPORTANT |
| G. Page Détail | 4 | ⭐⭐ IMPORTANT |
| H. Edge Cases | 5 | ⭐ SOUHAITABLE |
| I. Intégrité DB | 4 | ⭐⭐⭐ CRITIQUE |
| J. Migration | 3 | ⭐⭐ IMPORTANT |
| K. Sécurité | 3 | ⭐⭐⭐ CRITIQUE |
| L. Features Supprimées | 3 | ⭐⭐ IMPORTANT |
| **TOTAL** | **48** | |

---

## 🐛 SIGNALER UN BUG

Si vous trouvez un bug durant les tests:

1. Noter le numéro du test (ex: D3)
2. Décrire le comportement attendu vs réel
3. Fournir les logs console (frontend + backend)
4. Vérifier l'état de la DB si nécessaire

---

## ✅ VALIDATION FINALE

Une fois TOUS les tests passés:

- [ ] Backend fonctionne sans erreur
- [ ] Frontend compile sans warning
- [ ] Toutes les assignations fonctionnent (individuel + groupe)
- [ ] Propagation automatique fonctionne
- [ ] Sécurité multi-tenant respectée
- [ ] Performance acceptable (< 3s chargement)
- [ ] Pas de doublons en DB
- [ ] Ancien système invitations complètement retiré

**Durée estimée tests:** 2-3 heures (en fonction de la rigueur)

---

**Bonne chance avec les tests ! 🚀**
