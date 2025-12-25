# Sécurité - Cirque App

Patterns de sécurité implémentés dans l'application.

---

## 🔐 Authentification

### JWT (JSON Web Tokens)
**Implémentation:** `middleware/auth.js`

```js
// Login génère token
const token = jwt.sign(
  { id: user.id, role: user.role, ecole_id: user.ecole_id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Middleware vérifie token
const verifierToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};
```

**Storage:** `localStorage` côté frontend (AuthContext)

---

## 🛡️ Autorisations (RBAC)

### Rôles
- `admin` - Accès complet (toutes écoles si ecole_id=NULL)
- `professeur` - Gestion élèves, création figures école
- `eleve` - Progression personnelle uniquement

### Middleware de Contrôle

```js
// Require professeur ou admin
const estProfesseurOuAdmin = (req, res, next) => {
  if (req.user.role !== 'professeur' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  next();
};

// Require admin uniquement
const estAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin requis' });
  }
  next();
};
```

### Vérifications Propriété

**Pattern systématique:**
```js
router.put('/progression/:id', verifierToken, async (req, res) => {
  const progression = await ProgressionUtilisateur.findByPk(req.params.id);

  // Sécurité: vérifier propriété
  if (req.user.role !== 'admin' && req.user.id !== progression.utilisateur_id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  // ... logique
});
```

**Appliqué sur:**
- Progressions (`routes/progression.js`)
- Profils (`routes/utilisateurs.js`)
- Relations prof-élève (`routes/prof/eleves.js`)
- Tentatives (`routes/progression.js:410+`)

---

## 🏫 Multi-Tenant (Row-Level Security)

### Isolation par École

**Middleware:** `middleware/injecterContexteEcole.js`

```js
const injecterContexteEcole = async (req, res, next) => {
  if (req.user.ecole_id) {
    req.ecole = await Ecole.findByPk(req.user.ecole_id);
  }
  next();
};
```

### Filtrage Automatique

**Queries Sequelize avec scope:**
```js
// Mauvais (pas de filtrage)
const figures = await Figure.findAll();

// Bon (filtré par école)
const figures = await Figure.findAll({
  where: {
    [Op.or]: [
      { ecole_id: req.user.ecole_id },  // Figures école
      { ecole_id: null }                 // Catalogue public
    ]
  }
});
```

### Admin Global Exception

**Admin avec ecole_id=NULL:**
- Voit TOUTES les données (toutes écoles)
- Peut modifier catalogue public
- Bypass filtres multi-tenant

---

## 🔒 Validation Données

### Validation Inputs

**Pattern:**
```js
router.post('/progression', verifierToken, async (req, res) => {
  const { utilisateur_id, figure_id } = req.body;

  // Validation présence
  if (!utilisateur_id || !figure_id) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  // Validation type
  if (typeof utilisateur_id !== 'number') {
    return res.status(400).json({ error: 'Type invalide' });
  }

  // ... logique
});
```

### Validation Séquence

**Empêcher validations incohérentes:**
```js
// Vérifier existence progression avant validation étape
const progression = await ProgressionUtilisateur.findByPk(progressionId);
if (!progression) {
  return res.status(404).json({ error: 'Progression introuvable' });
}
```

---

## 🚫 Protection OWASP Top 10

### 1. Injection SQL
**Protection:** Sequelize ORM (parameterized queries)
```js
// ✅ Sûr (Sequelize)
await Utilisateur.findOne({ where: { email: req.body.email } });

// ❌ Dangereux (raw query)
await sequelize.query(`SELECT * FROM Users WHERE email='${email}'`);
```

### 2. Broken Authentication
**Protection:**
- JWT avec expiration (24h)
- Hashage bcrypt (salt rounds: 10)
- Pas de tokens dans URL

### 3. Sensitive Data Exposure
**Protection:**
- Passwords hashés (bcrypt)
- JWT secret dans `.env`
- Exclusion password des responses:
```js
const user = await Utilisateur.findByPk(id, {
  attributes: { exclude: ['mot_de_passe'] }
});
```

### 4. XML External Entities (XXE)
**N/A:** Pas de parsing XML

### 5. Broken Access Control
**Protection:**
- Vérifications propriété systématiques
- Middleware role-based
- Row-level security multi-tenant

### 6. Security Misconfiguration
**Protection:**
- `.env` pour secrets (pas committé)
- CORS configuré
- Helmet.js recommandé (TODO)

### 7. XSS (Cross-Site Scripting)
**Protection:**
- React échappe automatiquement (JSX)
- Pas de `dangerouslySetInnerHTML`
- Validation inputs backend

### 8. Insecure Deserialization
**Protection:**
- Validation JSON stricte
- Pas de `eval()` ou `Function()`

### 9. Using Components with Known Vulnerabilities
**Protection:**
- `npm audit` régulier
- Dépendances à jour

### 10. Insufficient Logging
**Protection:**
- Console.log sur événements critiques:
  - Login attempts
  - Validation étapes
  - Élèves bloqués (grit)
  - Errors

---

## 🔑 Patterns Sécurité par Feature

### Latéralité
```js
// Vérifier propriété progression avant validation
const progression = await ProgressionUtilisateur.findByPk(progressionId);
if (req.user.role !== 'admin' && req.user.id !== progression.utilisateur_id) {
  return res.status(403).json({ error: 'Accès refusé' });
}
```

### Grit Score (Tentatives)
```js
// Même vérification pour enregistrer tentatives
// Empêche élève A d'enregistrer tentatives pour élève B
```

### Élèves Négligés
```js
// Prof ne voit QUE ses élèves
const relation = await RelationProfEleve.findOne({
  where: { professeur_id: req.user.id, eleve_id: eleveId, statut: 'accepte' }
});
if (!relation) {
  return res.status(403).json({ error: 'Cet élève ne vous est pas assigné' });
}
```

---

## ⚠️ Points d'Attention

### À Améliorer
1. **Rate Limiting:** Pas implémenté (vulnérable brute-force)
2. **HTTPS Enforcement:** À configurer en production
3. **CSP Headers:** Pas de Content Security Policy
4. **Input Sanitization:** Validation basique (pourrait être renforcée)
5. **Session Management:** Pas de refresh tokens (token expire après 24h)

### Recommandations Production
```bash
npm install helmet express-rate-limit
```

```js
// server.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // max 100 requests per IP
});
app.use('/api/', limiter);
```

---

## 🧪 Tests Sécurité

Voir `docs/TESTS.md` section Sécurité.

**Quick Security Tests:**
1. **Auth:** Tenter accès route protégée sans token → 401
2. **RBAC:** Élève tente accès route prof → 403
3. **Ownership:** User A tente modifier progression User B → 403
4. **Multi-tenant:** École A tente accès données École B → 404/403
