# Tests - Cirque App

Guide de test pour valider les fonctionnalités.

---

## 🧪 Tests Manuels (Quick Start)

### Setup
```bash
# Backend
cd backend
npm run db:reset  # Reset + migrate + seed
npm run dev       # Port 5000

# Frontend (autre terminal)
cd frontend
npm start         # Port 3000
```

---

## 🔐 Tests Authentification

### Test 1: Login Élève
```bash
# UI: http://localhost:3000/login
Email: lucas.moreau@voltige.fr
Password: Password123!
```
**Attendu:** Redirection vers Mon Programme

### Test 2: Login Prof
```bash
Email: jean.martin@voltige.fr
Password: Password123!
```
**Attendu:** Accès Dashboard Prof

### Test 3: Login Admin
```bash
Email: admin@cirqueapp.com
Password: Admin123!
```
**Attendu:** Accès Admin (toutes écoles)

---

## 📏 Tests Phase 2 - Latéralité

### Test: Validation Bilatérale (Roue)

**Steps:**
1. Login élève: `lucas.moreau@voltige.fr`
2. Mon Programme → Ajouter figure "Roue"
3. Détail figure → Valider côté GAUCHE
4. Vérifier: +50% XP (ex: si base=20 → +10 XP)
5. Valider côté DROITE
6. Vérifier: +50% XP supplémentaire (+10 XP)
7. Vérifier: Les deux côtés marqués validés (chips verts)

**API Test:**
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lucas.moreau@voltige.fr","password":"Password123!"}' \
  | jq -r '.token')

# Valider gauche
curl -X POST http://localhost:5000/api/progression/1/etapes/1/valider \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cote":"gauche"}'

# Valider droite
curl -X POST http://localhost:5000/api/progression/1/etapes/1/valider \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cote":"droite"}'
```

**Attendu:**
- Première réponse: `{ xp: 10, cote: "gauche" }`
- Deuxième réponse: `{ xp: 10, cote: "droite" }`
- Total user XP: +20

---

## 🔥 Tests Phase 2 - Grit Score

### Test: Bonus Persévérance

**Steps:**
1. Login élève
2. Détail figure → Étape 1
3. Cliquer "❌ Raté" 5 fois
4. Cliquer "✅ Réussi"
5. Vérifier: Bonus XP +20% affiché
6. Vérifier: Message "5 échecs avant réussite"

**API Test:**
```bash
# 5 échecs
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/progression/1/etapes/1/tenter \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"reussie":false,"commentaire":"Tentative '$i'"}'
done

# 1 réussite
curl -X POST http://localhost:5000/api/progression/1/etapes/1/tenter \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reussie":true}'
```

**Attendu:**
```json
{
  "success": true,
  "xp": 24,
  "bonus_percent": 20,
  "echecs_avant_reussite": 5
}
```

### Test: Grit Score Global

**API Test:**
```bash
curl -X GET http://localhost:5000/api/progression/grit-score \
  -H "Authorization: Bearer $TOKEN"
```

**Attendu:**
```json
{
  "grit_score": {
    "grit_score": 2.5,
    "total_echecs": 5,
    "total_reussites": 2,
    "taux_echec_recent": 60,
    "max_consecutive_echecs": 5,
    "interpretation": {
      "niveau": "perseverant",
      "message": "💪 Bonne résilience"
    }
  }
}
```

---

## 📅 Tests Phase 2 - Memory Decay

### Test: Opacity Dégradée

**Steps:**
1. Login élève avec progressions anciennes (seeded)
2. Mon Programme
3. Vérifier:
   - Figures <30j: Opacity 100%, border green solid
   - Figures 30-90j: Opacity 80%, border orange dashed
   - Figures 90-180j: Opacity 60%, border red
   - Figures >180j: Opacity 50%, badge "À réviser"

**Simulation (modifier date en DB):**
```sql
-- Créer validation ancienne
UPDATE EtapeUtilisateurs
SET date_validation = DATE_SUB(NOW(), INTERVAL 100 DAY)
WHERE utilisateur_id = 3 AND id = 5;
```

**Frontend Test:**
```js
import { calculateDecayLevel } from 'utils/memoryDecay';

const decay = calculateDecayLevel('2024-08-01'); // ~100 jours
console.log(decay);
// Expected: { level: 'critical', opacity: 0.66, color: 'error', ... }
```

---

## 👻 Tests Phase 2 - Élèves Négligés

### Test: Dashboard Prof

**Steps:**
1. Login prof: `jean.martin@voltige.fr`
2. Dashboard → Section "Élèves à suivre"
3. Vérifier: Liste élèves sans interaction >30j
4. Vérifier: Badges orange (30-59j) et rouge (60+j)

**API Test:**
```bash
# Login prof
PROF_TOKEN=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.martin@voltige.fr","password":"Password123!"}' \
  | jq -r '.token')

# Élèves négligés
curl -X GET "http://localhost:5000/api/prof/statistiques/eleves-negliges?seuil_jours=30&limit=10" \
  -H "Authorization: Bearer $PROF_TOKEN"
```

**Attendu:**
```json
{
  "total_eleves": 10,
  "negliges_count": 3,
  "taux_neglige": 30,
  "seuil_jours": 30,
  "eleves": [
    {
      "id": 15,
      "nom": "Durand",
      "prenom": "Paul",
      "jours_sans_interaction": 75,
      "niveau_alerte": "critique",
      "derniere_interaction": "2024-09-01T10:30:00Z",
      "type_derniere_interaction": "view_profile"
    }
  ]
}
```

### Test: Engagement Prof

**API Test:**
```bash
curl -X GET http://localhost:5000/api/prof/statistiques/engagement \
  -H "Authorization: Bearer $PROF_TOKEN"
```

**Attendu:**
```json
{
  "statistiques_engagement": {
    "total_eleves": 10,
    "interactions_7j": 25,
    "interactions_30j": 120,
    "moyenne_interactions_par_eleve": 12
  }
}
```

---

## 🔒 Tests Sécurité

### Test 1: Route Protégée Sans Token
```bash
curl -X GET http://localhost:5000/api/progression/utilisateur/1
```
**Attendu:** `401 Unauthorized`

### Test 2: Élève Accède Données Autre Élève
```bash
# Login élève 1
TOKEN_1=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lucas.moreau@voltige.fr","password":"Password123!"}' \
  | jq -r '.token')

# Tenter accès progression élève 2 (ID=15)
curl -X GET http://localhost:5000/api/progression/utilisateur/15 \
  -H "Authorization: Bearer $TOKEN_1"
```
**Attendu:** `403 Forbidden`

### Test 3: Élève Tente Route Prof
```bash
curl -X GET http://localhost:5000/api/prof/statistiques/eleves-negliges \
  -H "Authorization: Bearer $TOKEN_1"
```
**Attendu:** `403 Forbidden`

### Test 4: Multi-Tenant Isolation
```bash
# Prof École Voltige tente accéder élève Académie
curl -X GET http://localhost:5000/api/prof/eleves/11 \
  -H "Authorization: Bearer $PROF_TOKEN"
```
**Attendu:** `403 Forbidden` (élève pas dans relation prof)

---

## 📊 Tests Gamification

### Test: Streak
1. Login élève
2. Valider étape jour 1
3. Valider étape jour 2 (lendemain)
4. Vérifier: Streak = 2 jours

### Test: Badge Automatique
1. Valider 3 figures Acrobatie
2. Vérifier: Badge "Acrobate Débutant" débloqué

### Test: Titre Niveau
1. Atteindre niveau 5
2. Vérifier: Titre "Artiste Confirmé" débloqué

---

## ⚙️ Tests Techniques

### Test: Migrations
```bash
cd backend
npm run db:reset
# Vérifier: 6 migrations exécutées (001-006)
```

### Test: Seed
```bash
npm run seed
# Vérifier:
# - 2 écoles créées
# - 7 disciplines
# - 50+ figures
# - 4 profs, 20 élèves
# - Relations prof-élève
# - Interactions seeded
# - Tentatives seeded (grit scenarios)
```

### Test: Models Relations
```bash
node
> const { Utilisateur, ProgressionUtilisateur, Figure } = require('./models');
> Utilisateur.findByPk(1, { include: [{ model: ProgressionUtilisateur, include: [Figure] }] });
# Vérifier: Relations chargées correctement
```

---

## 🐛 Tests Edge Cases

### Test 1: Validation Déjà Validée (Latéralité)
```bash
# Valider gauche 2 fois
curl -X POST http://localhost:5000/api/progression/1/etapes/1/valider \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cote":"gauche"}'

curl -X POST http://localhost:5000/api/progression/1/etapes/1/valider \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cote":"gauche"}'
```
**Attendu:** Deuxième requête → `400 Bad Request "Côté gauche déjà validé"`

### Test 2: Tentative Sans Progression
```bash
# Tenter valider étape d'une progression inexistante
curl -X POST http://localhost:5000/api/progression/9999/etapes/1/tenter \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reussie":true}'
```
**Attendu:** `404 Not Found "Progression introuvable"`

### Test 3: Figure Non-Bilatérale avec Côté
```bash
# Tenter valider côté sur figure non-bilatérale
curl -X POST http://localhost:5000/api/progression/1/etapes/5/valider \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cote":"gauche"}'
```
**Attendu:** Validation normale (ignoré si figure non-bilatérale)

---

## 📈 Checklist Tests Avant Production

- [ ] Tous les endpoints retournent codes HTTP corrects
- [ ] Auth fonctionne (JWT)
- [ ] RBAC bloque accès non autorisés
- [ ] Multi-tenant isole données par école
- [ ] XP calculé correctement (base + bonus)
- [ ] Latéralité split XP 50/50
- [ ] Grit Score bonus progressif
- [ ] Memory Decay affiche dégradation
- [ ] Élèves négligés détectés >30j
- [ ] Seed crée données cohérentes
- [ ] Migrations s'exécutent sans erreur
- [ ] Relations Sequelize chargent correctement
- [ ] Passwords hashés (bcrypt)
- [ ] Tokens expirent après 24h
- [ ] Validation inputs empêche injections
