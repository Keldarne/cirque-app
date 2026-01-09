# Correctifs Réseau Local - Cirque App

**Date** : 2026-01-09
**Status** : ✅ Résolu

---

## 🐛 Problèmes Identifiés

### 1. Erreurs CORS
**Symptôme** : `Access to fetch blocked by CORS policy`

**Cause** : Le backend acceptait uniquement une IP hardcodée (`192.168.0.50:3000`)

**Solution** : ✅ CORS dynamique acceptant tous les réseaux locaux
- `192.168.x.x:3000`
- `10.x.x.x:3000`
- `172.16-31.x.x:3000`
- `localhost:3000`

**Fichier modifié** : `backend/server.js` (lignes 31-58)

---

### 2. Proxy Frontend (Erreur 500)
**Symptôme** :
```
POST http://192.168.0.50:3000/api/utilisateurs/login → 500 Internal Server Error
Proxy error: Could not proxy request from 192.168.0.50:3000 to http://localhost:4000 (ECONNREFUSED)
```

**Cause** : Le proxy de `package.json` pointait vers `localhost:4000`, mais dans Docker, `localhost` ne pointe pas vers le backend.

**Solution** : ✅ Proxy configuré pour Docker
- **Docker** : `"proxy": "http://backend:4000"` (nom du service Docker)
- **Dev local** : `"proxy": "http://localhost:4000"` (via script de switch)

**Fichier modifié** : `frontend/package.json` (ligne 8)

---

### 3. Configuration IP Hardcodée
**Symptôme** : Besoin de modifier manuellement les fichiers à chaque changement d'IP

**Solution** : ✅ Script de configuration automatique
- Détecte l'IP locale automatiquement
- Met à jour `docker-compose.yml` et `frontend/.env.local`
- Affiche les URLs d'accès

**Fichier créé** : `scripts/setup-network.js`

---

## 🛠️ Fichiers Créés/Modifiés

### Nouveaux Fichiers
1. **`scripts/setup-network.js`** - Auto-configuration IP locale
2. **`scripts/switch-mode.js`** - Basculer entre dev local et Docker
3. **`frontend/.env`** - Config par défaut pour dev local
4. **`docs/RESEAU_LOCAL_TESTS.md`** - Guide de test détaillé
5. **`docs/CORRECTIFS_RESEAU_LOCAL.md`** - Ce fichier

### Fichiers Modifiés
1. **`backend/server.js`** - CORS dynamique (lignes 31-58)
2. **`frontend/package.json`** - Proxy Docker (ligne 8)
3. **`package.json`** (racine) - Nouvelles commandes npm
4. **`RESEAU_LOCAL.md`** - Mise à jour avec nouveaux correctifs

---

## 📋 Nouvelles Commandes Disponibles

### Configuration Réseau
```bash
# Auto-configure pour réseau local (Docker)
npm run setup:network

# Configure pour dev local uniquement
npm run setup:localhost
```

### Basculer entre Modes
```bash
# Configurer pour dev local (sans Docker)
npm run mode:local

# Configurer pour Docker
npm run mode:docker
```

---

## ✅ Tests de Validation

### Test 1 : Backend CORS
```bash
# Test localhost
curl -i -H "Origin: http://localhost:3000" http://localhost:4000/api/disciplines

# Test IP réseau local
curl -i -H "Origin: http://192.168.0.50:3000" http://localhost:4000/api/disciplines

# Test autre IP réseau local
curl -i -H "Origin: http://192.168.0.100:3000" http://localhost:4000/api/disciplines
```

✅ **Résultat attendu** : Header `Access-Control-Allow-Origin` avec l'origin demandée

---

### Test 2 : Proxy Frontend → Backend
```bash
# Via proxy frontend
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"lucas.moreau@voltige.fr","mot_de_passe":"Password123!"}' \
  http://192.168.0.50:3000/api/utilisateurs/login
```

✅ **Résultat attendu** : Réponse JSON du backend (token ou erreur)

---

### Test 3 : Navigateur
1. Ouvrir `http://192.168.0.50:3000`
2. Se connecter avec `lucas.moreau@voltige.fr` / `Password123!`
3. Vérifier Console (F12) : Pas d'erreurs CORS

✅ **Résultat attendu** : Login réussi, données s'affichent

---

## 🚀 Guide de Démarrage Rapide

### Avec Docker (Production-like)

```bash
# 1. Configurer automatiquement
npm run setup:network
npm run mode:docker

# 2. Démarrer
docker-compose up -d

# 3. Vérifier
docker-compose logs -f frontend backend
```

**Accès** :
- PC hôte : `http://localhost:3000`
- Réseau local : `http://192.168.0.50:3000` (votre IP)

---

### Dev Local (Sans Docker)

```bash
# 1. Configurer pour dev local
npm run mode:local

# 2. Démarrer backend (terminal 1)
cd backend
npm run reset-and-seed && npm start

# 3. Démarrer frontend (terminal 2)
cd frontend
npm start
```

**Accès** : `http://localhost:3000`

---

## 🔍 Diagnostic

### Vérifier Configuration Actuelle

```bash
# Mode proxy frontend
cat frontend/package.json | grep "proxy"

# Variables d'env Docker
docker-compose config | grep REACT_APP_API_URL

# Variables d'env dans container
docker-compose exec frontend printenv | grep REACT_APP
```

---

### Logs en Cas de Problème

```bash
# Backend
docker-compose logs backend --tail=50

# Frontend
docker-compose logs frontend --tail=50

# En temps réel
docker-compose logs -f frontend backend
```

---

## 📊 Résumé des Changements

| Composant | Avant | Après | Impact |
|-----------|-------|-------|--------|
| **CORS Backend** | IP hardcodée | Dynamique (regex) | ✅ Fonctionne avec toute IP locale |
| **Proxy Frontend** | `localhost:4000` | `backend:4000` | ✅ Fonctionne dans Docker |
| **Configuration IP** | Manuelle | Script auto | ✅ Plus besoin de modifier les fichiers |
| **Dev Local** | ❌ Cassé | ✅ Script switch mode | ✅ Fonctionne avec commande |

---

## 🎓 Architecture Réseau

### Docker

```
┌─────────────────────────────────────────────────────────┐
│                    Réseau Local                          │
│                                                           │
│  📱 Mobile (192.168.0.51)                                │
│       ↓                                                   │
│  💻 PC Hôte (192.168.0.50)                               │
│       ↓                                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Docker Network (cirque-network)        │    │
│  │                                                   │    │
│  │  ┌──────────────┐      ┌──────────────┐        │    │
│  │  │   Frontend   │ ───→ │   Backend    │        │    │
│  │  │  :3000       │      │  :4000       │        │    │
│  │  │              │      │              │        │    │
│  │  │ Proxy:       │      │ CORS:        │        │    │
│  │  │ backend:4000 │      │ dynamic      │        │    │
│  │  └──────────────┘      └──────┬───────┘        │    │
│  │                                │                 │    │
│  │                                ↓                 │    │
│  │                        ┌──────────────┐         │    │
│  │                        │   MySQL      │         │    │
│  │                        │   :3306      │         │    │
│  │                        └──────────────┘         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Dev Local (Sans Docker)

```
┌─────────────────────────────────────────────┐
│              PC (localhost)                 │
│                                              │
│  ┌──────────────┐      ┌──────────────┐    │
│  │   Frontend   │ ───→ │   Backend    │    │
│  │  :3000       │      │  :4000       │    │
│  │              │      │              │    │
│  │ Proxy:       │      │ CORS:        │    │
│  │ localhost:   │      │ dynamic      │    │
│  │   4000       │      │              │    │
│  └──────────────┘      └──────┬───────┘    │
│                                │            │
│                                ↓            │
│                        ┌──────────────┐    │
│                        │   MySQL      │    │
│                        │   :3306      │    │
│                        └──────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 📚 Documentation Associée

- **[RESEAU_LOCAL.md](../RESEAU_LOCAL.md)** - Guide utilisateur
- **[RESEAU_LOCAL_TESTS.md](./RESEAU_LOCAL_TESTS.md)** - Tests détaillés
- **[DOCKER.md](./DOCKER.md)** - Guide Docker complet

---

**Status Final** : ✅ Tous les problèmes résolus
