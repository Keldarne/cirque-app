# Features - Cirque App

Liste des fonctionnalités implémentées et leur statut.

---

## ✅ Core Features (Phase 1)

### 🏫 Multi-Tenant
- ✅ Écoles isolées avec row-level security
- ✅ Plans d'abonnement (Basic, Premium, Trial)
- ✅ Admin global + admins école
- ✅ Catalogue public partagé

### 👥 Gestion Utilisateurs
- ✅ Rôles: admin, professeur, eleve
- ✅ Authentification JWT
- ✅ Profils avec avatar, niveau, XP
- ✅ Utilisateurs solo (sans école)

### 📚 Catalogue
- ✅ Disciplines (13 disponibles)
- ✅ Figures (50+ avec étapes)
- ✅ CRUD complet (permissions par rôle)
- ✅ Vidéos YouTube intégrées

### 📈 Progression
- ✅ Tracking par étape individuelle (ProgressionEtape)
- ✅ Validation d'étapes avec statut (non_commence, en_cours, valide)
- ✅ Calcul XP dynamique par étape
- ✅ Système de niveaux basé sur XP total
- ✅ Latéralité (gauche/droite/bilateral)
- ✅ Validation professeur (valide_par_prof_id)

### 🏅 Gamification
- ✅ Badges (15+) - Débutant, Intermédiaire, Avancé, Expert, Spécialisations
- ✅ Titres (10+) - Apprenti Circassien, Maître de la Piste, etc.
- ✅ Défis quotidiens/hebdomadaires
- ✅ Streaks (séries de jours consécutifs)
- ✅ Freeze streak (1 jour gratuit)

### 👨‍🏫 Système Prof-Élève
- ✅ Invitations élèves (code unique)
- ✅ Gestion groupes/classes
- ✅ Notes prof privées sur élèves
- ✅ Dashboard prof

---

## 🚀 Phase 2 - Statistiques Avancées (COMPLET)

### 📏 Latéralité (Validation Bilatérale)
**Status:** ✅ Implémenté
**Files:**
- DB: `migrations/001-add-laterality.js`
- Models: `models/Figure.js` (lateralite_requise), `models/ProgressionEtape.js` (lateralite)
- API: `routes/progression.js:261-398`
- Seed: `seed/data/figures.js` (3 figures bilateral)

**Fonctionnement:**
- Figures marquées `bilateral` nécessitent validation gauche ET droite
- XP divisé: 50% par côté
- Endpoint: `POST /api/progression/:id/etapes/:id/valider` avec `{ cote: 'gauche'|'droite'|'bilateral' }`

**Figures Concernées:**
- Roue (Acrobatie)
- Jonglage 3 balles cascade (Balles)
- Clé de pied tissu (Tissu)

---

### 🔥 Persévérance (Grit Score)
**Status:** ✅ Implémenté
**Files:**
- DB: `migrations/003-add-tentatives-etapes.js`, `migrations/004-add-seuil-echecs-critique.js`
- Models: `models/TentativeEtape.js` (lié à ProgressionEtape), `models/ProgressionEtape.js` (état)
- Structure: `models/EtapeProgression.js` (seuil_echecs_critique)
- Service: `services/EntrainementService.js`
- API: `routes/entrainement.js`
- Seed: `seed/modules/seedTentatives.js`

**Fonctionnement:**
- Tracking de TOUTES les tentatives (réussies ET échouées)
- Calcul Grit Score = ratio échecs/réussites
- Bonus XP progressif:
  - 3 échecs avant réussite: +10% XP
  - 5 échecs: +20% XP
  - 10 échecs: +50% XP
- Détection élèves bloqués (seuil configurable, défaut: 5 échecs)
- Alerte prof si seuil dépassé

**Endpoints:**
- `POST /api/entrainement/tentatives` - Enregistrer tentative (body: { etapeId, reussite })
- `GET /api/progression/grit-score` - Score global utilisateur

**Scénarios Seed:**
- 20% High Grit (5-12 tentatives, 70% échecs)
- 15% Talent Naturel (1-3 tentatives, 20% échecs)
- 65% Normal (2-6 tentatives, 40% échecs)

---

### 📅 Memory Decay (Fraîcheur des Acquis)
**Status:** ✅ Implémenté
**Files:**
- Frontend: `frontend/src/utils/memoryDecay.js`

**Fonctionnement:**
- Calcul côté frontend (pure CSS/JS)
- Dégradation visuelle progressive selon ancienneté validation
- Timeline:
  - **0-30 jours:** Fresh - Opacity 100%, border green solid
  - **30-90 jours:** Warning - Opacity 80%, border orange dashed
  - **90-180 jours:** Critical - Opacity 60%, border red, timer icon
  - **180+ jours:** Forgotten - Opacity 50%, border gray, badge "À réviser"
- Grayscale filter progressif
- Aucun changement DB requis

**Utilisation:**
```js
import { calculateDecayLevel, getDecayStyles } from 'utils/memoryDecay';

const decay = calculateDecayLevel(validation.date_validation);
const styles = getDecayStyles(decay, theme);
```

---

### 👻 Élèves Négligés (Interactions Prof)
**Status:** ✅ Implémenté
**Files:**
- DB: `migrations/002-add-interactions-prof-eleve.js`
- Models: `models/InteractionProfEleve.js`
- Service: `services/InteractionService.js`
- API: `routes/prof/statistiques.js:102-183`
- Seed: `seed/modules/seedInteractions.js`

**Fonctionnement:**
- Tracking automatique de TOUTES les interactions prof-élève:
  - `view_profile` - Consultation profil
  - `add_comment` - Ajout commentaire
  - `validate_step` - Validation étape
  - `send_message` - Envoi message
  - `update_notes` - Modification notes
- Détection élèves sans interaction récente
- Niveaux d'alerte:
  - **30+ jours:** Warning (badge orange)
  - **60+ jours:** Critical (badge rouge)

**Endpoints:**
- `GET /api/prof/statistiques/eleves-negliges?seuil_jours=30&limit=10`
- `GET /api/prof/statistiques/engagement`
- `GET /api/prof/statistiques/interactions/:eleveId?limit=20`

**Scénarios Seed:**
- 70% élèves actifs (interactions <30 jours)
- 15% Warning (30-59 jours)
- 15% Critical (60-90 jours)

---

## 🔮 Features Futures (Non Implémentées)

### Programmation Prof → Élève
- Prof peut créer programmes personnalisés
- Assigner programmes à élèves spécifiques
- Élèves voient programmes assignés

### Catalogue École PRO vs LOISIR
- Option école PRO ou LOISIR
- Seuils decay/alertes ajustés selon volume entraînement

### Révisions Memory Decay (Backend)
- Workflow révision avec validation tacite (2 jours)
- Table `RevisionsEtapes`
- Bonus XP révision (+5/+10/+20 XP selon decay level)
- Cron job mise à jour decay levels

### Analytics Avancés Latéralité
- Table `ValidationsLaterales` pour historique complet
- Balance score calculé (gauche vs droite)
- Stats symétrie par discipline

---

## 📊 Résumé Implémentation Phase 2

| Feature | DB Tables | Migrations | Services | Routes | Seed | Status |
|---------|-----------|------------|----------|--------|------|--------|
| Latéralité | 0 (fields) | 1 | 0 | Modified | ✅ | ✅ |
| Grit Score | 1 | 2 | 1 | 3 new | ✅ | ✅ |
| Memory Decay | 0 | 0 | 0 | 0 | N/A | ✅ |
| Élèves Négligés | 1 | 1 | 1 | 3 new | ✅ | ✅ |
| **Total** | **2** | **4** | **2** | **6+** | **2** | **✅** |

---

## 🧪 Tests Recommandés

Voir `docs/TESTS.md` pour guide complet.

**Quick Tests:**
1. Latéralité: Valider Roue gauche puis droite (vérifier XP 50%+50%)
2. Grit: Enregistrer 5 échecs puis 1 réussite (vérifier bonus XP +20%)
3. Memory Decay: Vérifier opacity figures anciennes dans Mon Programme
4. Élèves Négligés: Appeler `/api/prof/statistiques/eleves-negliges` (vérifier top 10)
