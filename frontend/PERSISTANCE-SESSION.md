# Persistance de Session - Comment ça fonctionne

## Vue d'ensemble

L'application Cirque utilise **localStorage** pour persister la session utilisateur entre les rechargements de page et les visites.

---

## Mécanisme de persistance

### 1. Stockage lors de la connexion

Quand un utilisateur se connecte ou s'inscrit :

```javascript
// Sauvegarde dans localStorage
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));

// Mise à jour de l'état React
setToken(data.token);
setUser(data.user);
```

**Données stockées :**
- `token` : Token JWT (string)
- `user` : Objet utilisateur complet (JSON stringifié)

---

### 2. Restauration au chargement de l'application

Au démarrage de l'application (dans `AuthContext`) :

```javascript
useEffect(() => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (storedToken && storedUser) {
    try {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } catch (error) {
      // Si corruption des données, on les supprime
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  setLoading(false);
}, []);
```

**Ordre de chargement :**
1. L'application démarre
2. Le `AuthProvider` charge les données de `localStorage`
3. Si valides, l'utilisateur est automatiquement connecté
4. La navigation reflète l'état connecté

---

### 3. Synchronisation automatique

Les données utilisateur sont synchronisées automatiquement :

```javascript
useEffect(() => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}, [user]);
```

**Cas d'usage :**
- Gain d'XP → Mise à jour automatique dans `localStorage`
- Montée de niveau → Persistance automatique
- Modification du profil → Sauvegarde automatique

---

### 4. Suppression lors de la déconnexion

Lors du logout :

```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setToken(null);
  setUser(null);
};
```

---

## Flux complet

### Scénario : Première connexion

1. **Utilisateur se connecte**
   ```
   POST /utilisateurs/login
   → Reçoit token + données utilisateur
   ```

2. **Sauvegarde dans localStorage**
   ```javascript
   localStorage.setItem('token', token)
   localStorage.setItem('user', JSON.stringify(user))
   ```

3. **État React mis à jour**
   ```
   isAuthenticated = true
   Navbar affiche "Pseudo + Niveau"
   ```

---

### Scénario : Rechargement de page

1. **Page se recharge**
   ```
   AuthProvider s'initialise
   ```

2. **Lecture de localStorage**
   ```javascript
   token = localStorage.getItem('token')
   user = JSON.parse(localStorage.getItem('user'))
   ```

3. **Restauration de l'état**
   ```
   isAuthenticated = true (automatique)
   Utilisateur reste connecté
   ```

---

### Scénario : Fermeture du navigateur

1. **Utilisateur ferme le navigateur**
   ```
   localStorage persiste (pas de cookie, pas d'expiration)
   ```

2. **Réouverture du navigateur**
   ```
   Données toujours présentes dans localStorage
   Utilisateur automatiquement reconnecté
   ```

---

## Fonctions disponibles dans AuthContext

### `updateUser(userData)`

Met à jour partiellement les données utilisateur :

```javascript
const { updateUser } = useAuth();

// Exemple : après avoir gagné de l'XP
updateUser({ xp: 50, niveau: 2 });
```

**Avantages :**
- Mise à jour automatique dans localStorage
- Pas besoin de gérer manuellement la persistance

---

### `refreshUser()`

Rafraîchit les données depuis le serveur (à implémenter) :

```javascript
const { refreshUser } = useAuth();

// Après une action importante
await refreshUser();
```

---

## Sécurité

### ✅ Points forts

- Token JWT avec expiration (24h côté serveur)
- Pas de stockage du mot de passe
- Synchronisation automatique

### ⚠️ Limitations

- **localStorage accessible en JavaScript** : Risque XSS
- **Pas de refresh token** : Session expire après 24h
- **Pas d'invalidation côté serveur** : Le token reste valide jusqu'à expiration

### 🔒 Améliorations possibles

1. **Utiliser httpOnly cookies** (plus sécurisé que localStorage)
2. **Implémenter refresh tokens** (renouvellement automatique)
3. **Ajouter un timeout d'inactivité** (déconnexion auto après X minutes)
4. **Vérifier la validité du token** au démarrage

---

## Test de la persistance

### Étapes pour tester :

1. **Se connecter**
   ```
   - Aller sur http://localhost:3000/auth
   - Se connecter avec un compte
   - Vérifier que la navbar affiche le pseudo
   ```

2. **Vérifier localStorage**
   ```
   - Ouvrir DevTools (F12)
   - Onglet "Application" → "Local Storage" → "http://localhost:3000"
   - Voir "token" et "user"
   ```

3. **Recharger la page (F5)**
   ```
   - L'utilisateur reste connecté
   - La navbar affiche toujours le pseudo
   - Pas de redirection vers /auth
   ```

4. **Fermer et rouvrir le navigateur**
   ```
   - Rouvrir http://localhost:3000
   - L'utilisateur est toujours connecté
   ```

5. **Se déconnecter**
   ```
   - Cliquer sur "Déconnexion" dans le profil
   - Vérifier que localStorage est vidé
   - Vérifier la redirection vers la page d'accueil
   ```

6. **Recharger après déconnexion**
   ```
   - La navbar affiche "Connexion / Inscription"
   - L'utilisateur n'est plus connecté
   ```

---

## Inspection avec DevTools

### Voir les données stockées :

1. **Ouvrir DevTools** : `F12` ou `Cmd+Option+I` (Mac)

2. **Aller dans "Application"**
   - Panneau de gauche → "Storage" → "Local Storage"
   - Cliquer sur `http://localhost:3000`

3. **Données visibles :**
   ```
   Key: token
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   Key: user
   Value: {"id":1,"pseudo":"test","email":"test@example.com","niveau":1,"xp":0}
   ```

### Modifier manuellement (pour tester) :

1. **Double-cliquer sur une valeur**
2. **Modifier** (exemple : changer le niveau)
3. **Recharger la page**
4. **Observer** que les changements sont reflétés

---

## Gestion d'erreurs

### Corruption de données

Si `localStorage` contient des données invalides :

```javascript
try {
  setUser(JSON.parse(storedUser));
} catch (error) {
  // Suppression automatique des données corrompues
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
```

### Token expiré

Le token JWT expire après 24h. À l'expiration :
- Les requêtes échoueront avec un 401
- **Solution actuelle** : L'utilisateur doit se reconnecter
- **Amélioration future** : Implémenter un refresh token

---

## Résumé

✅ **La persistance de session fonctionne automatiquement**

- ✅ Connexion → Sauvegarde dans localStorage
- ✅ Rechargement → Restauration automatique
- ✅ Modification → Synchronisation automatique
- ✅ Déconnexion → Nettoyage complet

**L'utilisateur reste connecté même après :**
- Rechargement de page (F5)
- Fermeture du navigateur
- Redémarrage de l'ordinateur

**Jusqu'à ce que :**
- Il se déconnecte manuellement
- Le token expire (24h)
- Il vide son localStorage
