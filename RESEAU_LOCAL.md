# Accès Réseau Local - Guide Rapide

## ✅ Configuration Effectuée

Le frontend Cirque App est maintenant accessible depuis **tout le réseau local** !

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

### ⚠️ Configuration Préalable (IMPORTANT)

**Avant de démarrer**, modifiez `docker-compose.yml` ligne 66 :

```yaml
# Remplacer localhost par VOTRE IP locale
REACT_APP_API_URL: http://192.168.0.50:4000  # ← Modifier ici
```

**Trouver votre IP** : `ipconfig | findstr "IPv4"` (Windows)

### Avec Docker (Recommandé)
```bash
# 1. Modifier docker-compose.yml avec votre IP locale (voir ci-dessus)

# 2. Démarrer tous les services
docker-compose up -d --build

# 3. Voir les logs
docker-compose logs -f
```

Le frontend sera accessible sur :
- http://localhost:3000 (PC hôte)
- http://192.168.0.50:3000 (réseau local)

### Sans Docker (Dev Local)
```bash
# Frontend
cd frontend
npm start
# Frontend écoute automatiquement sur 0.0.0.0:3000

# Backend (autre terminal)
cd backend
npm run reset-and-seed && npm run dev
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

### Frontend inaccessible depuis autre appareil

1. **Vérifier IP locale** : `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. **Vérifier pare-feu** : Autoriser ports 3000 et 4000
3. **Vérifier réseau** : Même Wi-Fi sur tous les appareils
4. **Redémarrer services** : `docker-compose restart frontend`

### Backend API ne répond pas

Le backend doit être accessible depuis le frontend :
- Vérifier `REACT_APP_API_URL` dans `.env.local`
- Pour accès mobile, utiliser IP locale : `http://192.168.0.50:4000`

---

## 📚 Documentation Complète

Voir [docs/DOCKER.md](docs/DOCKER.md) pour guide complet Docker.

---

**Date** : 2026-01-09
**Status** : ✅ Configuré et testé
