# Comptes de test - Cirque App

## 🏫 Architecture Multi-Tenant

L'application utilise une architecture multi-tenant avec écoles isolées :

### École Voltige (Plan Basic)
- **Type**: École de cirque - Plan Basic
- **Statut**: Active
- **Professeurs**: 2
- **Élèves**: 4
- **Figures spécifiques**: 2 (Pyramide Humaine École, Jonglage Feu - Technique Voltige)

### Académie des Arts du Cirque (Plan Premium Trial)
- **Type**: École de cirque - Plan Premium Trial
- **Statut**: Trial (expire dans 7 jours)
- **Professeurs**: 2
- **Élèves**: 4
- **Figures spécifiques**: 2 (Contorsion Aérienne Avancée, Acrobatie Portée - Méthode Académie)

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
  - Peut créer des figures publiques (visibilité globale)

---

### 🏫 School Admin (NOUVEAU)

#### School Admin École Voltige
- **Email**: `admin.voltige@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `school_admin`
- **École**: École Voltige
- **Permissions**:
  - Gestion complète du catalogue de son école
  - Création/modification/suppression de figures école-spécifiques
  - Accès aux statistiques de l'école
  - Ne peut PAS accéder aux données d'autres écoles

---

### 🏫 École Voltige - Professeurs

#### Professeur Jean Martin
- **Email**: `jean.martin@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `professeur`
- **Spécialité**: Jonglage
- **Permissions**:
  - Gérer ses élèves (invitations, groupes, suivi)
  - Créer des figures personnalisées pour son école (via `/api/prof/figures`)
  - Accès aux statistiques avancées:
    - 📊 Dashboard élèves négligés
    - 🔥 Grit Score / Persévérance des élèves
    - 📏 Suivi latéralité (gauche/droite)
    - 📅 Memory Decay (fraîcheur des acquis)
  - Accès aux programmes et suggestions

#### Professeur Sophie Dubois
- **Email**: `sophie.dubois@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `professeur`
- **Spécialité**: Acrobatie

---

### 🏫 École Voltige - Élèves (scénarios assignés)

#### Lucas Moreau (at_risk)
- **Email**: `lucas.moreau@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: 2
- **XP**: 300
- **Scénario**: `at_risk` (faible progression: 0-30% de maîtrise, 5 figures)
- **Usage**: Tester les alertes pour élèves en difficulté

#### Emma Bernard (stable)
- **Email**: `emma.bernard@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: 3
- **XP**: 600
- **Scénario**: `stable` (progression moyenne: 20-60% de maîtrise, 7 figures)
- **Usage**: Élève normal avec progression constante

#### Louis Thomas (progressing)
- **Email**: `louis.thomas@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: 4
- **XP**: 850
- **Scénario**: `progressing` (bonne progression: 40-75% de maîtrise, 8 figures)
- **Usage**: Élève performant en progression active

#### Chloé Petit (balanced)
- **Email**: `chloe.petit@voltige.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: 3
- **XP**: 550
- **Scénario**: `balanced` (équilibré multi-disciplines: 50-80% de maîtrise, 7 figures)
- **Usage**: Élève avec progression équilibrée + 1 figure école-spécifique

---

### 🎪 Académie des Arts du Cirque - Professeurs

#### Professeur Marie Lefebvre
- **Email**: `marie.lefebvre@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `professeur`
- **Spécialité**: Aérien

#### Professeur Pierre Moreau
- **Email**: `pierre.moreau@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `professeur`
- **Spécialité**: Équilibre

---

### 🎪 Académie des Arts du Cirque - Élèves (scénarios assignés)

#### Gabriel Garnier (balanced)
- **Email**: `gabriel.garnier@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: 4
- **XP**: 700
- **Scénario**: `balanced` (équilibré multi-disciplines, 7 figures)
- **Usage**: Élève équilibré + figures école-spécifiques Académie

#### Alice Faure (specialist_juggling)
- **Email**: `alice.faure@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: 5
- **XP**: 950
- **Scénario**: `specialist_juggling` (spécialisé jonglage: 6-7 figures jonglage)
- **Usage**: Test spécialisation discipline

#### Raphaël Rousseau (specialist_aerial)
- **Email**: `raphael.rousseau@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: 5
- **XP**: 1100
- **Scénario**: `specialist_aerial` (spécialisé aérien: 6-7 figures aériennes)
- **Usage**: Test spécialisation aérien + figure école "Contorsion Aérienne Avancée"

#### Zoé Blanc (low_safety)
- **Email**: `zoe.blanc@academie.fr`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **Niveau**: 3
- **XP**: 450
- **Scénario**: `low_safety` (surcharge: 10 figures, alerte sécurité)
- **Usage**: Tester les alertes pour pratique excessive

---

### 🌍 Utilisateurs Solo (sans école)

#### Alex Mercier
- **Email**: `alex.mercier@gmail.com`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **École**: Aucune (utilisateur indépendant)
- **Accès**: Catalogue public uniquement (35 figures)

#### Julie Fontaine
- **Email**: `julie.fontaine@gmail.com`
- **Mot de passe**: `Password123!`
- **Rôle**: `eleve`
- **École**: Aucune (utilisateur indépendant)
- **Accès**: Catalogue public uniquement (35 figures)

---

## 🎮 Données de test seeded

### Catalogue Public (partagé par toutes les écoles)

#### 📚 Disciplines (7)
- Jonglage
- Acrobatie
- Aérien
- Équilibre
- Manipulation d'Objets
- Clown/Expression
- Renforcement Musculaire

#### 🎯 Figures Publiques (35)
- 5 figures par discipline
- **Types**:
  - 28 figures artistiques
  - 7 figures de renforcement
- **Niveaux**: 1 (facile) à 5 (très difficile)

#### 🏫 Figures École-Spécifiques (4)

**École Voltige** (ecole_id: 1, visibilite: 'ecole'):
- Pyramide Humaine École (Acrobatie, niveau 4)
- Jonglage Feu - Technique Voltige (Jonglage, niveau 5)

**Académie** (ecole_id: 2, visibilite: 'ecole'):
- Contorsion Aérienne Avancée (Aérien, niveau 5)
- Acrobatie Portée - Méthode Académie (Acrobatie, niveau 4)

#### 🏅 Badges (10)
- Premier Pas, Débutant, Intermédiaire, Avancé, Expert
- Spécialisations: Jongleur, Acrobate
- Streaks: 7 jours, 30 jours
- Explorateur

#### 🎖️ Titres (8)
- Novice, Apprenti Circassien, Artiste en Herbe
- Circassien Confirmé, Artiste de Cirque, Virtuose
- Maître Circassien, Légende du Cirque

#### 🎯 Défis (5)
- Challenge Débutant (quotidien)
- Semaine du Jonglage (hebdomadaire)
- Marathon 30 Jours (événement)
- Expert Niveau 5 (événement)
- Quotidien - 3 Étapes

---

## 🎲 Scénarios de test seeded (Optimisé)

### Distribution Utilisateurs
- **1 admin global** (accès total)
- **1 school_admin** (École Voltige uniquement)
- **4 professeurs** (2 par école)
- **8 élèves** (4 par école, scénarios assignés)
- **2 solo users** (accès catalogue public)

### Scénarios Élèves (assignés, non-random)

| Scénario | Description | Figures | Maîtrise | Élèves |
|----------|-------------|---------|----------|--------|
| `at_risk` | Élève en difficulté | 5 | 0-30% | Lucas Moreau (Voltige) |
| `stable` | Progression normale | 7 | 20-60% | Emma Bernard (Voltige) |
| `progressing` | Bon élève actif | 8 | 40-75% | Louis Thomas (Voltige) |
| `balanced` | Multi-disciplines | 7 | 50-80% | Chloé (Voltige), Gabriel (Académie) |
| `specialist_juggling` | Spécialisé jonglage | 6-7 | 50-80% | Alice Faure (Académie) |
| `specialist_aerial` | Spécialisé aérien | 6-7 | 50-80% | Raphaël Rousseau (Académie) |
| `low_safety` | Surcharge (alerte) | 10 | 50-80% | Zoé Blanc (Académie) |

### Tentatives / Grit Score (RÉDUIT 30%)
- **20% High Grit**: 5-15 tentatives/étape, 60% progressions avec tentatives
- **15% Talent Naturel**: 1-3 tentatives/étape, 40% progressions avec tentatives
- **65% Normal**: 2-8 tentatives/étape, 50% progressions avec tentatives

### 4 Modes d'Entraînement
Toutes les tentatives utilisent l'un des 4 modes:
- **Binaire**: Simple réussite/échec
- **Évaluation**: Score 1-3 (Échec/Instable/Maîtrisé)
- **Durée**: Temps de pratique en secondes
- **Évaluation + Durée**: Score + temps combinés

---

## 🧪 Guide de test

### Test 1: Multi-Tenant (Isolation École)
1. Connectez-vous avec `gabriel.garnier@academie.fr`
2. Consultez le catalogue: devrait voir **37 figures** (35 publiques + 2 Académie)
3. Vérifiez présence de "Contorsion Aérienne Avancée"
4. Vérifiez ABSENCE de "Pyramide Humaine École" (figure Voltige)
5. Déconnectez-vous

6. Connectez-vous avec `lucas.moreau@voltige.fr`
7. Consultez le catalogue: devrait voir **37 figures** (35 publiques + 2 Voltige)
8. Vérifiez présence de "Jonglage Feu - Technique Voltige"
9. Vérifiez ABSENCE de "Contorsion Aérienne Avancée" (figure Académie)

### Test 2: School Admin (Gestion Catalogue École)
1. Connectez-vous avec `admin.voltige@voltige.fr` (school_admin)
2. Accédez à la page Catalogue Admin
3. Devrait voir les 35 figures publiques + 2 figures École Voltige
4. Créer une nouvelle figure:
   - Endpoint: `POST /api/prof/figures`
   - Le système force automatiquement `ecole_id = 1` (Voltige)
   - Devrait réussir
5. Essayez de voir les figures de l'Académie: devrait échouer (isolation)

### Test 3: Professor Figure Management
1. Connectez-vous avec `jean.martin@voltige.fr` (professeur)
2. Accédez à la page Catalogue Admin
3. Créer une figure personnalisée:
   - Endpoint: `POST /api/prof/figures`
   - Le système force automatiquement `ecole_id = 1`
   - `visibilite = 'ecole'`
4. Vérifier que la figure est visible uniquement pour École Voltige

### Test 4: Grit Score (4 modes)
1. Connectez-vous avec `alice.faure@academie.fr`
2. Sur une étape en cours, enregistrez des tentatives:
   ```javascript
   // Mode binaire
   POST /api/entrainement/tentatives
   { progression_etape_id: X, type_saisie: 'binaire', reussie: false }

   // Mode évaluation
   POST /api/entrainement/tentatives
   { progression_etape_id: X, type_saisie: 'evaluation', score: 2 }

   // Mode durée
   POST /api/entrainement/tentatives
   { progression_etape_id: X, type_saisie: 'duree', duree_secondes: 120 }

   // Mode évaluation + durée
   POST /api/entrainement/tentatives
   { progression_etape_id: X, type_saisie: 'evaluation_duree', score: 3, duree_secondes: 180 }
   ```
3. Consultez l'historique: `GET /api/entrainement/tentatives/:etapeId`

### Test 5: Scénarios Spécialisés

**Élève at_risk** (Lucas):
- Progression: 5 figures seulement
- Maîtrise: 0-30% (faible)
- Usage: Tester alertes prof pour élève en difficulté

**Élève specialist_aerial** (Raphaël):
- Progression: 6-7 figures aériennes
- Inclut "Contorsion Aérienne Avancée" (figure Académie)
- Usage: Tester spécialisation + figures école

**Élève low_safety** (Zoé):
- Progression: 10 figures (surcharge)
- Usage: Tester alerte sécurité pour pratique excessive

---

## 🔧 Commandes utiles

### Réinitialiser et repeupler la base de données
```bash
# Depuis le répertoire root
npm run reset-and-seed

# Depuis backend/
npm run reset-and-seed

# Temps d'exécution: ~7 secondes (optimisé!)
```

### Mesurer le temps de seed
```bash
cd backend
node scripts/measure-seed-time.js
```

### Vérifier les données
```bash
# Compter les utilisateurs
mysql -u root -p cirque_app_dev -e "SELECT role, COUNT(*) FROM Utilisateurs GROUP BY role;"

# Vérifier figures école-spécifiques
mysql -u root -p cirque_app_dev -e "SELECT nom, ecole_id, visibilite FROM Figures WHERE visibilite='ecole';"

# Compter les progressions
mysql -u root -p cirque_app_dev -e "SELECT COUNT(*) FROM ProgressionEtapes;"
```

### Tester les routes API (exemples)
```bash
# Login
curl -X POST http://localhost:4000/api/utilisateurs/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.martin@voltige.fr","password":"Password123!"}'

# Obtenir figures (prof Voltige - devrait voir 37)
curl -X GET http://localhost:4000/api/prof/figures \
  -H "Authorization: Bearer YOUR_TOKEN"

# Créer figure école-spécifique (prof)
curl -X POST http://localhost:4000/api/prof/figures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Figure École",
    "descriptif": "Figure test",
    "discipline_id": 1,
    "etapes": [
      {"titre": "Étape 1", "description": "Test", "xp": 10, "ordre": 1}
    ]
  }'
```

---

## 📊 Statistiques Seed Optimisé

### Performance
- **Temps d'exécution**: ~7 secondes (objectif: <10s)
- **Amélioration**: 65% plus rapide que l'ancien système

### Volumétrie
- **Utilisateurs**: 16 (vs 29 avant) - 48% de réduction
- **Progressions**: ~180-300 (vs ~2,100 avant) - 85% de réduction
- **Tentatives**: ~500-1,000 (vs ~5,000-8,000 avant) - 85% de réduction
- **Figures totales**: 39 (35 publiques + 4 école-spécifiques)

### Couverture Tests
✅ Tous les scénarios représentés (1-2 élèves par scénario)
✅ Multi-tenant testé (2 écoles avec figures spécifiques)
✅ Tous les rôles présents (admin, school_admin, professeur, eleve)
✅ 4 modes d'entraînement distribués dans les tentatives
✅ Données réalistes et cohérentes

---

## 📝 Notes techniques

- **Hashage**: Tous les mots de passe sont hashés avec bcrypt
- **JWT**: Tokens avec expiration 24h
- **Multi-Tenant**: Filtrage automatique par `ecole_id` via middleware
- **Isolation**: Professeurs et school_admin ne voient que leur école
- **Figures école**: Créées automatiquement au seed, visibilité='ecole'
- **Scénarios**: Assignés (non-random) pour tests reproductibles
- **Performance**: Seed optimisé pour tests rapides (<10s)
