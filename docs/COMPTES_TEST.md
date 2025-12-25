# Comptes de test - Cirque App

## 🏫 Architecture Multi-Tenant

L'application utilise une architecture multi-tenant avec écoles isolées :

### École Voltige (Plan Basic)
- **Type**: École de cirque - Plan Basic
- **Statut**: Active
- **Professeurs**: 2
- **Élèves**: 10

### Académie Cirque (Plan Premium Trial)
- **Type**: École de cirque - Plan Premium Trial
- **Statut**: Trial (expire dans 27 jours)
- **Professeurs**: 2
- **Élèves**: 10

---

## 👥 Comptes de test disponibles

### 👑 Administrateur Global
- **Email**: `admin@cirqueapp.com`
- **Mot de passe**: `Admin123!`
- **Rôle**: `admin`
- **École**: Aucune (admin global)
- **Permissions**:
  - Accès total à toutes les écoles
  - Gestion du catalogue public (disciplines, figures, badges, titres)
  - Contrôle total sur l'application

---

### 🏫 École Voltige - Professeurs

#### Professeur Jean Martin
- **Email**: `jean.martin@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `professeur`
- **Spécialité**: Jonglage
- **Permissions**:
  - Gérer ses élèves (invitations, groupes, suivi)
  - Créer des figures personnalisées pour son école
  - Accès aux statistiques avancées (Phase 2):
    - 📊 Dashboard élèves négligés
    - 🔥 Grit Score / Persévérance des élèves
    - 📏 Suivi latéralité (gauche/droite)
    - 📅 Memory Decay (fraîcheur des acquis)

#### Professeur Sophie Dubois
- **Email**: `sophie.dubois@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `professeur`
- **Spécialité**: Acrobatie

---

### 🏫 École Voltige - Élèves (exemples)

#### Lucas Moreau
- **Email**: `lucas.moreau@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: Variable (1-6)
- **Scénario seed**: Peut être "high_grit", "talent_naturel" ou "normal"

#### Emma Bernard
- **Email**: `emma.bernard@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`

**Autres élèves** : Thomas, Petit, Robert, Durand, Lefebvre, Girard, Morel (tous `@voltige.fr`)

---

### 🎪 Académie Cirque - Professeurs

#### Professeur Marie Lefebvre
- **Email**: `marie.lefebvre@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `professeur`
- **Spécialité**: Tissu Aérien

#### Professeur Pierre Moreau
- **Email**: `pierre.moreau@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `professeur`
- **Spécialité**: Trapèze

---

### 🎪 Académie Cirque - Élèves (exemples)

#### Gabriel Garnier
- **Email**: `gabriel.garnier@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`

#### Alice Faure
- **Email**: `alice.faure@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`

**Autres élèves** : Raphaël, Zoé, Nathan, Clara, Thomas, Inès, Alexandre, Sarah (tous `@academie.fr`)

---

### 🌍 Utilisateurs Solo (sans école)

#### Alex Mercier
- **Email**: `alex.mercier@gmail.com`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **École**: Aucune (utilisateur indépendant)

#### Julie Fontaine
- **Email**: `julie.fontaine@gmail.com`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`

#### Marc Chevalier
- **Email**: `marc.chevalier@gmail.com`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`

---

## 🎮 Données de test seeded

### Catalogue Public (partagé par toutes les écoles)

#### 📚 Disciplines (7)
- Acrobatie
- Balles
- Massues
- Anneaux
- Diabolo
- Tissu
- Cerceau Aérien
- Trapèze
- Pyramide
- Boule
- Fil tendu
- Fil mou
- Rola Bola

#### 🎯 Figures (50+)
- 15 figures de renforcement
- 35+ figures artistiques
- **3 figures avec latéralité** :
  - 🎪 Roue (Acrobatie) - `bilateral`
  - 🤹 Jonglage 3 balles cascade (Balles) - `bilateral`
  - 🎭 Clé de pied tissu (Tissu) - `bilateral`

#### 🏅 Badges (15+)
- Débutant, Intermédiaire, Avancé, Expert
- Spécialisations par discipline
- Badges spéciaux (Polyvalent, Sécurité, etc.)

#### 🎖️ Titres (10+)
- Apprenti Circassien
- Artiste Confirmé
- Maître de la Piste
- Légende Volante

#### 🎯 Défis
- Défis quotidiens
- Défis hebdomadaires
- Défis spéciaux

---

## 📊 Fonctionnalités Phase 2 (Statistiques Avancées)

### 📏 Latéralité (Validation Bilatérale)
- **Figures concernées** : Roue, Jonglage 3 balles, Clé de pied tissu
- **Système** : Validation séparée gauche/droite
- **XP** : 50% par côté validé
- **Route API** : `POST /api/progression/:progressionId/etapes/:etapeId/valider` (param `cote`)

### 🔥 Persévérance (Grit Score)
- **Tracking** : Toutes les tentatives (réussies et échouées)
- **Bonus XP** :
  - 3 échecs = +10% XP
  - 5 échecs = +20% XP
  - 10 échecs = +50% XP
- **Seuil critique** : Alerte prof après 5 échecs (configurable par étape)
- **Routes API** :
  - `POST /api/progression/:progressionId/etapes/:etapeId/tenter`
  - `GET /api/progression/grit-score`
  - `GET /api/progression/:progressionId/etapes/:etapeId/tentatives`

### 📅 Memory Decay (Fraîcheur des Acquis)
- **Timeline** :
  - 0-30 jours : Fresh (vert, 100% opacity)
  - 30-90 jours : Warning (orange, 80% opacity)
  - 90-180 jours : Critical (rouge, 60% opacity)
  - 180+ jours : Forgotten (gris, 50% opacity)
- **Implémentation** : Frontend-only (pure CSS/JS)
- **Utility** : `frontend/src/utils/memoryDecay.js`

### 👻 Élèves Négligés
- **Tracking** : Interactions prof-élève (view_profile, add_comment, validate_step, send_message, update_notes)
- **Alertes** :
  - 30+ jours sans interaction : Warning (badge orange)
  - 60+ jours sans interaction : Critical (badge rouge)
- **Routes API** :
  - `GET /api/prof/statistiques/eleves-negliges`
  - `GET /api/prof/statistiques/engagement`
  - `GET /api/prof/statistiques/interactions/:eleveId`

---

## 🎲 Scénarios de test seeded

### Interactions Prof-Élève
- **70% élèves actifs** : 5-20 interactions dans les 30 derniers jours
- **30% élèves négligés** :
  - 15% Warning (30-59 jours)
  - 15% Critical (60-90 jours)

### Tentatives / Grit Score
- **20% High Grit** : 5-12 tentatives par étape, 70% échecs
- **15% Talent Naturel** : 1-3 tentatives par étape, 20% échecs
- **65% Normal** : 2-6 tentatives par étape, 40% échecs

---

## 🧪 Guide de test

### Test 1 : Latéralité
1. Connectez-vous avec un élève (ex: `lucas.moreau@voltige.fr`)
2. Ajoutez la figure "Roue" à votre programme
3. Validez le côté gauche → Devrait donner 50% XP
4. Validez le côté droit → Devrait donner 50% XP supplémentaire
5. Vérifiez que les deux côtés sont marqués validés

### Test 2 : Grit Score
1. Connectez-vous avec un élève
2. Sur une étape, cliquez "❌ Raté" plusieurs fois
3. Puis cliquez "✅ Réussi"
4. Vérifiez le bonus XP (affiché dans la réponse)
5. Consultez `GET /api/progression/grit-score` pour voir votre score global

### Test 3 : Élèves Négligés (Prof)
1. Connectez-vous avec un prof (ex: `jean.martin@voltige.fr`)
2. Accédez à `GET /api/prof/statistiques/eleves-negliges`
3. Vérifiez la liste des élèves sans interaction récente
4. Les élèves sont classés par ordre de jours sans interaction

### Test 4 : Memory Decay
1. Connectez-vous avec un élève ayant des validations anciennes
2. Les figures validées devraient avoir une opacity réduite selon leur ancienneté
3. Les figures >30 jours devraient avoir un badge "À réviser"

---

## 🔧 Commandes utiles

### Réinitialiser la base de données
```bash
npm run db:reset
```

### Lancer le seed complet
```bash
npm run seed
```

### Tester les routes API (exemples)
```bash
# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.martin@voltige.fr","password":"Password123!"}'

# Élèves négligés (avec token)
curl -X GET http://localhost:5000/api/prof/statistiques/eleves-negliges \
  -H "Authorization: Bearer YOUR_TOKEN"

# Enregistrer tentative échouée
curl -X POST http://localhost:5000/api/progression/1/etapes/5/tenter \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reussie":false,"commentaire":"Presque!"}'
```

---

## 📝 Notes techniques

- **Hashage** : Tous les mots de passe sont hashés avec bcrypt
- **JWT** : Tokens stockés dans localStorage (frontend)
- **Migrations** : 6 migrations DB exécutées (001-006)
- **Modèles** : 4 nouveaux modèles Phase 2 (InteractionProfEleve, TentativeEtape + fields)
- **Services** : InteractionService, TentativeService
- **Row-level security** : Chaque école a ses propres données isolées
