# Tests d'Accès Réseau Local - Cirque App

## ✅ Correctifs Appliqués

### 1. CORS Backend (✅ Testé)
Le backend accepte maintenant **dynamiquement** toutes les IPs du réseau local :
- ✅ `localhost:3000`
- ✅ `127.0.0.1:3000`
- ✅ `192.168.x.x:3000` (tous les réseaux locaux)
- ✅ `10.x.x.x:3000` (réseaux privés)
- ✅ `172.16-31.x.x:3000` (réseaux privés)

**Fichier modifié** : `backend/server.js` (lignes 31-58)

### 2. Proxy Frontend (✅ Corrigé)
Le proxy pointe maintenant vers `localhost:4000` au lieu de `backend:4000`.

**Fichier modifié** : `frontend/package.json` (ligne 8)

### 3. Script de Configuration Automatique (✅ Créé)
Un nouveau script détecte automatiquement votre IP locale et configure les fichiers.

**Commandes disponibles** :
```bash
npm run setup:network     # Pour accès réseau local
npm run setup:localhost   # Pour dev local uniquement
```

---

## 🧪 Tests à Effectuer

### Test 1 : Accès depuis le PC Hôte

1. **Ouvrir le navigateur** sur votre PC
2. **Accéder à** : `http://localhost:3000`
3. **Vérifier** :
   - ✅ La page s'affiche correctement
   - ✅ Aucune erreur CORS dans la console (F12)
   - ✅ Les données se chargent (disciplines, figures, etc.)

4. **Se connecter** avec un compte test :
   - **Élève** : `lucas.moreau@voltige.fr` / `Password123!`
   - **Prof** : `jean.martin@voltige.fr` / `Password123!`
   - **Admin** : `admin@cirqueapp.com` / `Admin123!`

5. **Vérifier** que les données s'affichent après connexion

---

### Test 2 : Accès depuis un Autre Appareil (Smartphone/Tablette)

1. **Vérifier** que l'appareil est sur le **même réseau Wi-Fi**

2. **Trouver votre IP locale** :
   ```bash
   # Windows
   ipconfig | findstr "IPv4"

   # Mac/Linux
   ifconfig | grep "inet "
   ```

3. **Ouvrir le navigateur** sur l'appareil mobile

4. **Accéder à** : `http://192.168.0.50:3000` (remplacer par votre IP)

5. **Vérifier** :
   - ✅ La page s'affiche
   - ✅ Pas d'erreur CORS
   - ✅ Les données se chargent
   - ✅ La connexion fonctionne

---

### Test 3 : Vérifier les Appels API

1. **Ouvrir la console navigateur** (F12 → Network)

2. **Rafraîchir la page** (Ctrl+R)

3. **Vérifier** les requêtes vers `http://192.168.0.50:4000/api/...` :
   - ✅ Status 200 ou 401 (pas 0 ou erreur CORS)
   - ✅ Headers CORS présents :
     - `Access-Control-Allow-Origin: http://192.168.0.50:3000`
     - `Access-Control-Allow-Credentials: true`

4. **Se connecter** et vérifier que les requêtes authentifiées passent

---

## 🔍 Diagnostic en Cas de Problème

### Problème 1 : CORS Error dans la Console

**Symptômes** :
```
Access to fetch at 'http://localhost:4000/api/...' from origin 'http://192.168.0.50:3000'
has been blocked by CORS policy
```

**Solution** :
1. Vérifier que le backend est bien redémarré :
   ```bash
   docker-compose restart backend
   ```

2. Vérifier les logs backend :
   ```bash
   docker-compose logs backend --tail=20
   ```

3. Si vous voyez `⚠️ CORS: Origin non autorisée`, vérifier `backend/server.js` ligne 31-58

---

### Problème 2 : Données ne S'affichent Pas

**Symptômes** :
- Page blanche ou spinners infinis
- Console : `Failed to fetch` ou `Network Error`

**Solution** :
1. Vérifier que le backend répond :
   ```bash
   curl http://localhost:4000/api/disciplines
   ```

2. Vérifier que `REACT_APP_API_URL` est correct :
   ```bash
   # Dans Docker
   docker-compose exec frontend printenv | grep REACT_APP_API_URL

   # Dev local
   cat frontend/.env.local | grep REACT_APP_API_URL
   ```

3. Devrait afficher : `REACT_APP_API_URL=http://192.168.0.50:4000` (votre IP)

4. Si incorrect, relancer le script :
   ```bash
   npm run setup:network
   docker-compose restart frontend
   ```

---

### Problème 3 : Accès Bloqué depuis Autre Appareil

**Symptômes** :
- Timeout ou "Cannot connect"
- Page ne charge pas du tout

**Solution** :
1. **Vérifier le pare-feu Windows** :
   ```powershell
   # Autoriser port 3000
   netsh advfirewall firewall add rule name="Cirque Frontend" dir=in action=allow protocol=TCP localport=3000

   # Autoriser port 4000
   netsh advfirewall firewall add rule name="Cirque Backend" dir=in action=allow protocol=TCP localport=4000
   ```

2. **Vérifier que les deux appareils sont sur le même réseau** :
   - Même SSID Wi-Fi
   - Même sous-réseau (ex: 192.168.0.x)

3. **Tester la connectivité** depuis l'appareil mobile :
   - Ouvrir le navigateur mobile
   - Accéder à `http://192.168.0.50:4000/api/disciplines`
   - Devrait retourner `{"error":"Token manquant"}` (c'est normal)
   - Si page blanche ou timeout → problème réseau/firewall

---

## 📋 Checklist de Validation

### Configuration Backend
- [x] CORS dynamique configuré
- [x] Backend écoute sur 0.0.0.0:4000
- [x] Headers CORS corrects dans les réponses

### Configuration Frontend
- [x] Proxy corrigé pour dev local
- [x] REACT_APP_API_URL configuré avec IP locale
- [x] HOST=0.0.0.0 dans package.json

### Tests Fonctionnels
- [ ] Page accessible depuis PC hôte (localhost:3000)
- [ ] Page accessible depuis réseau local (192.168.x.x:3000)
- [ ] Login fonctionne
- [ ] Données s'affichent après login
- [ ] Pas d'erreurs CORS dans la console
- [ ] Appels API réussissent (Status 200)

---

## 🚀 Redémarrage Complet

Si tout échoue, réinitialiser complètement :

```bash
# 1. Arrêter tous les services
docker-compose down

# 2. Reconfigurer avec votre IP
npm run setup:network

# 3. Redémarrer avec rebuild
docker-compose up -d --build

# 4. Vérifier les logs
docker-compose logs -f

# 5. Attendre que frontend compile
# Devrait voir : "webpack compiled successfully"
```

Accéder ensuite à :
- **PC hôte** : `http://localhost:3000`
- **Réseau local** : `http://192.168.0.50:3000` (votre IP)

---

## 📞 Support

Si les problèmes persistent :

1. **Vérifier les logs** :
   ```bash
   docker-compose logs backend --tail=50
   docker-compose logs frontend --tail=50
   ```

2. **Vérifier la configuration** :
   ```bash
   cat docker-compose.yml | grep REACT_APP_API_URL
   cat frontend/.env.local
   ```

3. **Tester les endpoints** :
   ```bash
   # Login
   curl -X POST -H "Content-Type: application/json" \
     -d '{"email":"lucas.moreau@voltige.fr","mot_de_passe":"Password123!"}' \
     http://localhost:4000/api/utilisateurs/login
   ```

---

**Date** : 2026-01-09
**Status** : ✅ Configuré et prêt à tester
