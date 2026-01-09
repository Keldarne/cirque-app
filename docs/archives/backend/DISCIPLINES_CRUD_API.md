# API CRUD Disciplines - Documentation pour Frontend

**Status**: ✅ Implémenté et testé (2026-01-09)
**Fichier backend**: `backend/src/routes/admin.js`
**Tests**: `backend/test/admin/disciplines-crud.test.js`

---

## Vue d'ensemble

Les routes CRUD pour les disciplines sont **entièrement implémentées** et **testées** (12 tests passants). Elles permettent au **Master Admin uniquement** de gérer le catalogue global des disciplines.

### Permissions

🔒 **Master Admin uniquement** (`role: 'admin'`)
- School admins, professeurs et élèves reçoivent une erreur **403 Forbidden**

---

## Endpoints

### 1. POST /api/admin/disciplines

Créer une nouvelle discipline.

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:
```json
{
  "nom": "Acrobatie",              // Requis, non vide, trimmed
  "description": "Description...", // Optionnel
  "image_url": "http://..."        // Optionnel
}
```

**Réponse 201 Created**:
```json
{
  "id": 7,
  "nom": "Acrobatie",
  "description": "Description...",
  "image_url": "http://...",
  "createdAt": "2026-01-09T...",
  "updatedAt": "2026-01-09T..."
}
```

**Erreurs**:
- **400 Bad Request**: `nom` manquant ou vide
  ```json
  { "message": "Le nom de la discipline est requis" }
  ```
- **403 Forbidden**: Utilisateur non admin
- **500 Internal Server Error**: Erreur serveur

---

### 2. PUT /api/admin/disciplines/:id

Modifier une discipline existante.

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:
```json
{
  "nom": "Acrobatie Sol",         // Requis, non vide, trimmed
  "description": "Nouvelle desc", // Optionnel (garde l'ancienne si absent)
  "image_url": "http://new..."    // Optionnel (garde l'ancienne si absent)
}
```

**Réponse 200 OK**:
```json
{
  "id": 7,
  "nom": "Acrobatie Sol",
  "description": "Nouvelle desc",
  "image_url": "http://new...",
  "createdAt": "2026-01-09T...",
  "updatedAt": "2026-01-09T..."
}
```

**Erreurs**:
- **400 Bad Request**: `nom` manquant ou vide
- **403 Forbidden**: Utilisateur non admin
- **404 Not Found**: Discipline inexistante
  ```json
  { "message": "Discipline non trouvée" }
  ```
- **500 Internal Server Error**: Erreur serveur

---

### 3. DELETE /api/admin/disciplines/:id

Supprimer une discipline.

⚠️ **Protection critique**: La suppression est **bloquée** si des figures sont associées à cette discipline (statut 409).

**Headers**:
```http
Authorization: Bearer <token>
```

**Réponse 200 OK** (suppression réussie):
```json
{
  "message": "Discipline supprimée avec succès"
}
```

**Erreurs**:
- **403 Forbidden**: Utilisateur non admin
- **404 Not Found**: Discipline inexistante
  ```json
  { "message": "Discipline non trouvée" }
  ```
- **409 Conflict**: Figures liées (PROTECTION CRITIQUE)
  ```json
  {
    "message": "Impossible de supprimer cette discipline",
    "details": "5 figure(s) sont encore associées à cette discipline. Veuillez d'abord supprimer ou réassigner ces figures.",
    "figuresCount": 5
  }
  ```
- **500 Internal Server Error**: Erreur serveur

---

## Cas d'usage Frontend

### Création de discipline

```javascript
try {
  const response = await fetch('/api/admin/disciplines', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nom: 'Trapèze',
      description: 'Arts aériens sur trapèze fixe et volant'
    })
  });

  if (response.ok) {
    const discipline = await response.json();
    console.log('Discipline créée:', discipline);
    // Actualiser la liste
  } else if (response.status === 400) {
    const error = await response.json();
    alert(`Erreur: ${error.message}`);
  }
} catch (error) {
  console.error('Erreur réseau:', error);
}
```

### Modification de discipline

```javascript
try {
  const response = await fetch(`/api/admin/disciplines/${disciplineId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nom: 'Trapèze Volant',
      description: 'Spécialité trapèze volant'
    })
  });

  if (response.ok) {
    const discipline = await response.json();
    console.log('Discipline modifiée:', discipline);
  } else if (response.status === 404) {
    alert('Discipline introuvable');
  }
} catch (error) {
  console.error('Erreur réseau:', error);
}
```

### Suppression de discipline avec gestion du 409

```javascript
try {
  const response = await fetch(`/api/admin/disciplines/${disciplineId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    console.log('Discipline supprimée avec succès');
    // Retirer de la liste
  } else if (response.status === 409) {
    const error = await response.json();
    // IMPORTANT: Afficher le détail et le count
    alert(
      `${error.message}\n\n${error.details}\n\nFigures associées: ${error.figuresCount}`
    );
  } else if (response.status === 404) {
    alert('Discipline introuvable');
  }
} catch (error) {
  console.error('Erreur réseau:', error);
}
```

---

## Validation et Sécurité

### Validation Backend

✅ Validations automatiques :
- **nom** : Requis, trim des espaces blancs
- **Existence** : Vérification avant PUT/DELETE (404 si absent)
- **Protection figures** : Comptage de figures liées avant DELETE

### Sécurité

✅ Protections en place :
- **Auth middleware** : `verifierToken` vérifie le JWT
- **Role middleware** : `estAdmin` vérifie que `user.role === 'admin'`
- **403 Forbidden** pour tout rôle non-admin
- **Protection cascade** : Empêche suppression si figures liées

---

## Tests

**Fichier**: `backend/test/admin/disciplines-crud.test.js`

12 tests couvrant :
1. ✅ Création réussie (master admin)
2. ✅ Création sans nom (400)
3. ✅ Création par professeur (403)
4. ✅ Trim des espaces dans le nom
5. ✅ Modification réussie (master admin)
6. ✅ Modification discipline inexistante (404)
7. ✅ Modification sans nom (400)
8. ✅ Modification par professeur (403)
9. ✅ Suppression réussie (discipline sans figures)
10. ✅ **Blocage suppression** avec figures liées (409) 🔥
11. ✅ Suppression discipline inexistante (404)
12. ✅ Suppression par professeur (403)

**Lancer les tests** :
```bash
cd backend
npm test -- test/admin/disciplines-crud.test.js
```

---

## Exemples de Réponses d'Erreur

### 400 Bad Request
```json
{
  "message": "Le nom de la discipline est requis"
}
```

### 403 Forbidden
```json
{
  "message": "Accès interdit : réservé aux administrateurs"
}
```

### 404 Not Found
```json
{
  "message": "Discipline non trouvée"
}
```

### 409 Conflict (Protection Critique)
```json
{
  "message": "Impossible de supprimer cette discipline",
  "details": "12 figure(s) sont encore associées à cette discipline. Veuillez d'abord supprimer ou réassigner ces figures.",
  "figuresCount": 12
}
```

### 500 Internal Server Error
```json
{
  "message": "Erreur serveur",
  "details": "Détails technique de l'erreur"
}
```

---

## Checklist Frontend

Lors de l'implémentation dans `DisciplineManager.js`, assurez-vous de :

- [ ] Envoyer le token Bearer dans l'en-tête `Authorization`
- [ ] Gérer le statut **409** avec un message explicite pour l'utilisateur
- [ ] Afficher le `figuresCount` pour informer du nombre de figures à réassigner
- [ ] Gérer le statut **403** (rediriger vers page d'erreur ou afficher message)
- [ ] Trim le nom côté frontend également (double validation)
- [ ] Actualiser la liste après CREATE/UPDATE/DELETE réussi
- [ ] Gérer les erreurs réseau (try/catch)
- [ ] Afficher un loader pendant les requêtes

---

## Notes Importantes

### Protection Cascade

La protection **409 Conflict** empêche la suppression accidentelle de disciplines avec des figures associées. **C'est une règle métier critique** pour préserver l'intégrité des données.

Si l'utilisateur veut vraiment supprimer une discipline, il doit :
1. Supprimer ou réassigner toutes les figures liées
2. Puis supprimer la discipline

**Ne pas implémenter de suppression en cascade automatique côté frontend** - c'est dangereux et non souhaité.

### Trim Automatique

Le backend trim automatiquement le `nom` avant sauvegarde. Vous pouvez également trim côté frontend pour un meilleur UX (feedback immédiat).

### Champs Optionnels

Pour `description` et `image_url` :
- Si absents du body : valeurs conservées (PUT) ou NULL (POST)
- Si envoyés vides (`""` ou `null`) : valeurs mises à NULL

---

## Support

Pour toute question ou bug :
- **Documentation backend complète** : [`backend/docs/INTEGRATION_LOG.md`](../backend/docs/INTEGRATION_LOG.md)
- **Tests** : `backend/test/admin/disciplines-crud.test.js`
- **Implémentation** : `backend/src/routes/admin.js` (lignes 158-255)
