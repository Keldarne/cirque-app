# Debug Token Invalide - Guide de Diagnostic

## 🔍 Vérifications à Faire dans le Navigateur

### 1. Vérifier que le Token est Stocké

Ouvrez la **Console** (F12 → Console) et tapez :

```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

✅ **Attendu** : Vous devriez voir un long token JWT et les infos utilisateur

❌ **Si null** : Le token n'est pas stocké → reconnectez-vous

---

### 2. Vérifier l'URL de Base API

Dans la Console, tapez :

```javascript
console.log('API URL:', process.env.REACT_APP_API_URL);
```

✅ **Attendu** : `http://192.168.0.50:4000` (votre IP)

❌ **Si undefined ou autre** : Le frontend n'a pas la bonne config

---

### 3. Inspecter une Requête qui Échoue

1. Allez dans **Network** (F12 → Network)
2. Rafraîchissez la page
3. Trouvez une requête qui retourne `{"error":"Token invalide"}`
4. Cliquez dessus
5. Vérifiez l'onglet **Headers** :

**Request Headers** (devrait contenir) :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

✅ **Si présent** : Le token est envoyé → problème backend
❌ **Si absent** : Le token n'est pas envoyé → problème frontend

---

### 4. Vérifier l'URL de la Requête

Dans **Network**, regardez l'URL complète de la requête :

✅ **Correct** : `http://192.168.0.50:4000/api/...`
❌ **Incorrect** : `http://192.168.0.50:3000/api/...` (mauvais port)

---

## 🔧 Solutions par Scénario

### Scénario A : Token non stocké
**Symptôme** : `localStorage.getItem('token')` retourne `null`

**Solution** :
1. Déconnectez-vous
2. Reconnectez-vous
3. Vérifiez que le token est maintenant présent

---

### Scénario B : Token présent mais pas envoyé
**Symptôme** : Token dans localStorage mais pas dans `Authorization` header

**Cause** : Le code frontend ne récupère pas le token correctement

**Solution** :
```javascript
// Forcer le rechargement du code
location.reload(true);

// OU vider le cache
localStorage.clear();
location.reload();
```

---

### Scénario C : Mauvaise URL API
**Symptôme** : `process.env.REACT_APP_API_URL` est undefined ou incorrect

**Cause** : Le frontend n'a pas été rebuild avec la bonne variable

**Solution** : Rebuild le frontend :
```bash
docker-compose down frontend
docker-compose up -d --build frontend
```

Attendez 30 secondes puis rechargez.

---

### Scénario D : Token envoyé mais invalide côté backend
**Symptôme** : Header `Authorization` présent mais backend refuse

**Causes possibles** :
1. JWT_SECRET a changé entre login et requête
2. Token corrompu
3. Token expiré (>24h)

**Solution** :
```javascript
// Vider localStorage et se reconnecter
localStorage.clear();
location.reload();
```

---

## 🧪 Test de Validation Complète

Après avoir appliqué les solutions, testez :

### Dans la Console :
```javascript
// 1. Vérifier le token
console.log('Token:', localStorage.getItem('token'));

// 2. Tester une requête manuelle
fetch('http://192.168.0.50:4000/api/progression/programmes', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
  .then(r => r.json())
  .then(d => console.log('Réponse:', d))
  .catch(e => console.error('Erreur:', e));
```

✅ **Si ça fonctionne** : Le problème est dans le code frontend qui n'utilise pas correctement `api.js`

❌ **Si ça échoue aussi** : Le problème est côté backend (token invalide ou CORS)

---

## 📞 Informations à Fournre pour Debug

Si le problème persiste, copiez-collez ces infos :

### Console :
```javascript
console.log({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user'),
  apiUrl: process.env.REACT_APP_API_URL,
  currentUrl: window.location.href
});
```

### Network :
- URL de la requête qui échoue
- Méthode (GET, POST, etc.)
- Status Code (401, 500, etc.)
- Headers de la requête (surtout `Authorization`)
- Réponse du serveur

---

**Date** : 2026-01-09
