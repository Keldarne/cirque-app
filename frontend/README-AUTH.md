# Système d'Authentification - Frontend

## Fonctionnalités implémentées

### 1. Contexte d'Authentification (`AuthContext`)

Un contexte React global qui gère l'état d'authentification de l'utilisateur.

**Emplacement:** `src/contexts/AuthContext.js`

**Fonctionnalités:**
- `login(pseudo, motDePasse)` - Connexion utilisateur
- `register(pseudo, email, motDePasse)` - Inscription utilisateur
- `logout()` - Déconnexion
- `isAuthenticated` - État de connexion
- `user` - Informations de l'utilisateur connecté
- `token` - Token JWT
- Persistance dans `localStorage`

---

### 2. Page d'Authentification (`AuthPage`)

Page avec onglets pour connexion et inscription.

**Emplacement:** `src/pages/AuthPage.js`

**Route:** `/auth`

**Caractéristiques:**
- Onglet "Connexion" avec pseudo et mot de passe
- Onglet "Inscription" avec pseudo, email, mot de passe et confirmation
- Validation des formulaires côté client
- Affichage des erreurs
- Redirection automatique vers le profil après connexion
- Inscription suivie d'une connexion automatique

**Validations:**
- Tous les champs requis
- Email valide
- Mot de passe minimum 6 caractères
- Confirmation de mot de passe identique

---

### 3. Page de Profil (`ProfilPage`)

Affiche les informations et statistiques de l'utilisateur connecté.

**Emplacement:** `src/pages/ProfilPage.js`

**Route:** `/profil`

**Affichage:**
- Pseudo et email
- Niveau actuel
- Points d'expérience (XP)
- Barre de progression vers le prochain niveau
- Bouton de déconnexion
- Protection : redirection vers `/auth` si non connecté

**Statistiques:**
- Niveau avec icône trophée
- XP actuel / 100 avec icône étoile
- Barre de progression visuelle
- Pourcentage de progression

---

### 4. Barre de Navigation Mise à Jour (`NavigationBar`)

La barre de navigation s'adapte selon l'état de connexion.

**Emplacement:** `src/NavigationBar.js`

**États:**

**Non connecté:**
- Affiche "Connexion / Inscription" avec icône Login
- Redirige vers `/auth`

**Connecté:**
- Affiche le pseudo de l'utilisateur
- Affiche le niveau actuel
- Icône utilisateur (Person)
- Redirige vers `/profil`

---

## Flux d'utilisation

### Inscription

1. Cliquer sur "Connexion / Inscription" dans la navbar
2. Onglet "Inscription"
3. Remplir le formulaire:
   - Pseudo (3-50 caractères)
   - Email valide
   - Mot de passe (min 6 caractères)
   - Confirmation du mot de passe
4. Soumission → Création du compte
5. Connexion automatique
6. Redirection vers le profil

### Connexion

1. Cliquer sur "Connexion / Inscription"
2. Onglet "Connexion" (par défaut)
3. Remplir:
   - Pseudo
   - Mot de passe
4. Soumission → Authentification
5. Redirection vers le profil

### Profil

1. Une fois connecté, cliquer sur le pseudo dans la navbar
2. Voir les statistiques:
   - Niveau et XP
   - Progression vers le niveau suivant
   - Informations du compte
3. Bouton "Déconnexion" disponible

---

## API utilisées

### POST `/utilisateurs/register`

**Body:**
```json
{
  "pseudo": "string",
  "email": "string",
  "mot_de_passe": "string"
}
```

**Réponse:**
```json
{
  "message": "Utilisateur créé",
  "user": {
    "id": 1,
    "pseudo": "...",
    "email": "...",
    "niveau": 1,
    "xp": 0
  }
}
```

### POST `/utilisateurs/login`

**Body:**
```json
{
  "pseudo": "string",
  "mot_de_passe": "string"
}
```

**Réponse:**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGci...",
  "role": "standard",
  "user": {
    "id": 1,
    "pseudo": "...",
    "email": "...",
    "niveau": 1,
    "xp": 0
  }
}
```

---

## Stockage local

Les données suivantes sont stockées dans `localStorage`:

- `token` - Token JWT pour l'authentification
- `user` - Objet utilisateur complet (sans mot de passe)

**Persistance:** L'utilisateur reste connecté même après fermeture du navigateur.

---

## Composants Material-UI utilisés

- `AppBar`, `Toolbar` - Navigation
- `Paper`, `Card` - Conteneurs
- `TextField` - Champs de formulaire
- `Button` - Boutons d'action
- `Tabs`, `Tab` - Onglets connexion/inscription
- `Alert` - Messages d'erreur
- `LinearProgress` - Barre de progression XP
- `Grid` - Mise en page responsive
- Icons: `Person`, `Login`, `Star`, `EmojiEvents`, `ExitToApp`, `Email`

---

## Gestion des erreurs

### Erreurs affichées:

- Champs manquants
- Email invalide
- Mot de passe trop court
- Mots de passe non identiques
- Pseudo ou email déjà utilisé
- Identifiants incorrects
- Erreurs serveur

### Format:
Affichage via composant `Alert` de Material-UI en haut des formulaires.

---

## Sécurité

✅ **Mot de passe**
- Jamais affiché en clair (type="password")
- Hashé côté backend (bcrypt)
- Validation de longueur minimale

✅ **Token JWT**
- Stocké dans localStorage
- Expiration de 24h
- Inclut ID utilisateur et rôle

✅ **Protection des routes**
- Page profil redirige vers /auth si non connecté
- Vérification de l'état d'authentification

---

## Prochaines améliorations possibles

- [ ] Route protégée pour les admins
- [ ] Modification du profil (email, mot de passe)
- [ ] Page "Mot de passe oublié"
- [ ] Rafraîchissement automatique du token
- [ ] Affichage de la progression des figures
- [ ] Historique des niveaux atteints
- [ ] Badges et récompenses

---

## Test de l'authentification

1. **Démarrer le backend:**
   ```bash
   npm start
   ```

2. **Démarrer le frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Accéder à l'application:**
   - URL: http://localhost:3000
   - Cliquer sur "Connexion / Inscription"
   - Créer un compte ou se connecter
   - Naviguer vers le profil

4. **Vérifier localStorage:**
   - Ouvrir DevTools (F12)
   - Onglet "Application" → "Local Storage"
   - Voir `token` et `user`

---

## Structure des fichiers

```
frontend/src/
├── contexts/
│   └── AuthContext.js       # Contexte d'authentification global
├── pages/
│   ├── AuthPage.js          # Page connexion/inscription
│   ├── ProfilPage.js        # Page profil utilisateur
│   ├── DisciplinesPage.js   # (existant)
│   └── FiguresPage.js       # (existant)
├── App.js                   # Routes et provider
└── NavigationBar.js         # Barre de navigation adaptative
```

---

✅ **Système d'authentification complet et fonctionnel !**
