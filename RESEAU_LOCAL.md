# Accès Réseau Local - Guide Rapide

## ✅ Configuration Effectuée (Mise à jour 2026-01-09)

Le frontend Cirque App est maintenant accessible depuis **tout le réseau local** !

### 🆕 Correctifs Appliqués

1. **CORS Dynamique** (✅) : Le backend accepte automatiquement toutes les IPs du réseau local (192.168.x.x, 10.x.x.x, etc.)
2. **Proxy Frontend Corrigé** (✅) : Pointe vers localhost:4000 en dev local
3. **Script Auto-Configuration** (✅) : Détecte votre IP et configure automatiquement les fichiers

**Commandes rapides** :
```bash
npm run setup:network     # Auto-configure pour réseau local
npm run setup:localhost   # Configure pour dev local uniquement
```

---

## 🌐 Accès Frontend

### Sur votre PC (hôte)
```
http://localhost:3000
```

### Depuis un autre appareil (même réseau Wi-Fi)
```
http://192.168.0.50:3000
```

**⚠️ Remplacer `192.168.0.50` par votre IP locale** (voir ci-dessous)

---

## 🔍 Trouver Votre IP Locale

### Windows
```bash
ipconfig | findstr "IPv4"
```

### Mac / Linux
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# OU
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Résultat exemple** :
```
Adresse IPv4. . . . . . . . . . . . . .: 192.168.0.50
                                         ^^^^^^^^^^^^^^
                                         Votre IP locale
```

---

## 🚀 Démarrage

### 🎯 Configuration Automatique (RECOMMANDÉ)

**Plus besoin de modifier manuellement les fichiers !**

Utilisez le script de configuration automatique :

```bash
# 1. Détecter votre IP et configurer automatiquement
npm run setup:network

# 2. Démarrer l'application
docker-compose up -d --build
```

Le script va :
- ✅ Détecter votre IP locale automatiquement
- ✅ Mettre à jour `docker-compose.yml`
- ✅ Mettre à jour `frontend/.env.local`
- ✅ Afficher les URLs d'accès

### ⚙️ Configuration Manuelle (Alternative)

Si vous préférez configurer manuellement :

1. **Trouver votre IP locale** :
   ```bash
   ipconfig | findstr "IPv4"  # Windows
   ```

2. **Modifier `docker-compose.yml` ligne 66** :
   ```yaml
   REACT_APP_API_URL: http://VOTRE_IP:4000
   ```

3. **Note** : Le CORS backend est maintenant dynamique, plus besoin de modifier `backend/server.js` !

### Voir les Logs
```bash
docker-compose logs -f frontend backend
```

---

## 📱 Tester sur Mobile/Tablette

1. **Connectez l'appareil au même réseau Wi-Fi** que votre PC
2. **Ouvrez le navigateur** sur l'appareil mobile
3. **Entrez l'URL** : `http://192.168.0.50:3000` (remplacer par votre IP)
4. **Connectez-vous** avec un compte test :
   - Élève : `user1@example.com` / `user123`
   - Prof : `prof1@example.com` / `prof123`
   - Admin : `admin1@example.com` / `admin123`

---

## 🔥 Pare-feu

Si l'accès ne fonctionne pas, vérifiez que le pare-feu autorise les ports :

### Windows Firewall
```powershell
# Autoriser port 3000 (frontend)
netsh advfirewall firewall add rule name="Cirque App Frontend" dir=in action=allow protocol=TCP localport=3000

# Autoriser port 4000 (backend API)
netsh advfirewall firewall add rule name="Cirque App Backend" dir=in action=allow protocol=TCP localport=4000
```

### Mac Firewall
Paramètres Système → Réseau → Pare-feu → Autoriser les connexions entrantes pour Node.js

### Linux (ufw)
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp
```

---

## 🎯 Cas d'Usage

### 1. Test sur Smartphone
Testez l'interface mobile responsive sans déployer en production.

### 2. Démo Client
Montrez l'application sur une tablette lors d'une réunion.

### 3. Test Multi-Utilisateurs
Connectez plusieurs appareils simultanément pour tester les interactions.

### 4. Développement Collaboratif
Partagez votre environnement de dev local avec votre équipe sur le même réseau.

---

## ⚠️ Sécurité

**IMPORTANT** : Cette configuration est pour développement uniquement !

- ✅ OK pour réseau local privé (Wi-Fi maison/bureau)
- ❌ NE PAS exposer sur Internet public
- ❌ NE PAS utiliser en production

En production, utilisez :
- HTTPS (certificat SSL/TLS)
- Reverse proxy (Nginx, Caddy)
- Variables d'environnement sécurisées

---

## 🐛 Dépannage

### Problème : Erreurs CORS

**Symptôme** : Console affiche "blocked by CORS policy"

**Solution** :
```bash
# 1. Vérifier que le backend a redémarré
docker-compose restart backend

# 2. Vérifier les logs
docker-compose logs backend --tail=20

# 3. Le CORS est maintenant dynamique, devrait fonctionner avec toute IP locale
```

### Problème : Données ne S'affichent Pas

**Symptôme** : Page blanche ou spinners infinis

**Solution** :
```bash
# 1. Re-exécuter la configuration
npm run setup:network

# 2. Redémarrer frontend
docker-compose restart frontend

# 3. Vérifier la configuration
cat frontend/.env.local | grep REACT_APP_API_URL
# Devrait afficher : REACT_APP_API_URL=http://VOTRE_IP:4000
```

### Problème : Frontend Inaccessible depuis Autre Appareil

**Solutions** :
1. **Vérifier IP locale** : `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. **Vérifier pare-feu** : Autoriser ports 3000 et 4000 (voir section Pare-feu ci-dessus)
3. **Vérifier réseau** : Même Wi-Fi sur tous les appareils
4. **Tester connectivité** : Depuis mobile, accéder à `http://VOTRE_IP:4000/api/disciplines`

### Guide de Test Complet

Voir **[docs/RESEAU_LOCAL_TESTS.md](docs/RESEAU_LOCAL_TESTS.md)** pour :
- ✅ Checklist de validation
- 🧪 Tests pas-à-pas
- 🔍 Diagnostic détaillé

---

## 📚 Documentation Complète

Voir [docs/DOCKER.md](docs/DOCKER.md) pour guide complet Docker.

---

**Date** : 2026-01-09
**Status** : ✅ Configuré et testé
