# Guide de Déploiement: Cache GIF JugglingLab

## Vue d'Ensemble

Ce guide décrit les étapes pour activer le système de cache des GIFs JugglingLab, qui réduit le temps de chargement des figures de **95%+** (de 40-100 secondes à <1 seconde pour 20 figures).

**Date d'implémentation**: 2026-01-13
**Version**: 1.0

---

## Changements Implémentés

### Backend

1. **Nouveau champ DB**: `gif_url` ajouté au modèle `Figure`
2. **Service JugglingLabService**: Génération et cache des GIFs
3. **Serveur statique**: Configuration Express pour servir `/gifs`
4. **Intégration FigureService**: Auto-génération à la création/modification
5. **Script de migration**: `scripts/backfill-gifs.js` pour figures existantes

### Frontend

1. **FigureCard.js**: Priorité `gif_url` > `image_url` > génération dynamique
2. **MetadataViewer.js**: Affichage GIF caché si disponible

### Infrastructure

1. **Docker**: Volume `gif_cache` pour persistance
2. **.gitignore**: Exclusion des `*.gif` générés

---

## Étapes de Déploiement

### Étape 1: Appliquer la Migration SQL

**Option A - Via MySQL CLI** (recommandé):

```bash
# Se connecter à MySQL
mysql -u root -p cirque_app_dev

# Exécuter la migration
source backend/migrations/004_add_gif_url_to_figures.sql;

# Vérifier
DESCRIBE Figures;
# Doit afficher la colonne "gif_url VARCHAR(255)" après "video_url"
```

**Option B - Via WhoDB** (Docker):

1. Ouvrir http://localhost:8080
2. Se connecter à la base `cirque_app_dev`
3. Onglet "Query"
4. Coller le contenu de `backend/migrations/004_add_gif_url_to_figures.sql`
5. Exécuter

**Option C - Via Sequelize** (automatique au prochain reset):

```bash
# Le champ sera créé automatiquement car le modèle Figure a été mis à jour
cd backend
npm run reset-and-seed
```

### Étape 2: Redémarrer le Backend

**Mode Local**:

```bash
cd backend
npm start
# Vérifier le log: "📁 Static GIF serving configured at /gifs"
```

**Mode Docker**:

```bash
docker-compose down
docker-compose up -d --build
# Ou simplement:
docker-compose restart backend
```

### Étape 3: Générer les GIFs des Figures Existantes

**Script de backfill** (optionnel mais recommandé):

```bash
cd backend
node scripts/backfill-gifs.js

# Options disponibles:
node scripts/backfill-gifs.js --force       # Régénérer tous les GIFs
node scripts/backfill-gifs.js --figureId=5  # Figure spécifique
```

**Sortie attendue**:

```
=== 🎨 JugglingLab GIF Backfill ===

📊 Statistiques:
   Total figures trouvées: 50
   Figures avec siteswap: 15
   Taille batch: 10

--- 📦 Batch 1/2 (10 figures) ---

🔄 Figure 5: "Cascade 3 Balles" (3)
   ✅ Succès: /gifs/5-098f6bcd.gif

...

=== 📊 Résumé du Backfill ===
✅ Succès:  15
❌ Échecs:  0
📝 Total:   15
```

### Étape 4: Vérifier le Fonctionnement

**1. Vérifier que les GIFs sont générés**:

```bash
# Local
ls -lh backend/public/gifs/
# Doit afficher des fichiers .gif

# Docker
docker-compose exec backend ls -lh public/gifs/
```

**2. Tester l'API**:

```bash
# Créer une figure avec siteswap
curl -X POST http://localhost:4000/api/admin/figures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test GIF Cache",
    "discipline_id": 1,
    "metadata": {"siteswap": "531"},
    "etapes": [{"titre": "Étape 1", "description": "Test"}]
  }'

# Réponse doit inclure: "gif_url": "/gifs/123-abc123.gif"
```

**3. Tester le serveur statique**:

```bash
curl -I http://localhost:4000/gifs/5-098f6bcd.gif
# Doit retourner: HTTP/1.1 200 OK, Content-Type: image/gif
```

**4. Tester dans le navigateur**:

1. Ouvrir http://localhost:3000
2. Aller sur le catalogue de figures
3. Ouvrir DevTools → Network tab
4. **Vérifier**: Aucun appel vers `jugglinglab.org`
5. **Vérifier**: Appels vers `localhost:4000/gifs/XXX.gif` réussissent
6. Les GIFs s'affichent instantanément (pas de spinner)

---

## Vérification End-to-End

### Backend Health Check

```bash
cd backend

# 1. Vérifier la migration SQL
echo "SELECT id, nom, gif_url FROM Figures WHERE metadata LIKE '%siteswap%' LIMIT 5;" | \
  mysql -u root -p cirque_app_dev

# 2. Compter les GIFs générés
find public/gifs -name "*.gif" | wc -l

# 3. Vérifier les logs du serveur
tail -f server.log | grep "JugglingLab"
```

### Frontend Health Check

1. **Test chargement rapide**:
   - Catalogue avec 20 figures devrait charger en <1 seconde
   - Pas de spinner sur les figures avec `gif_url`

2. **Test fallback**:
   - Créer une figure avec siteswap invalide
   - Vérifier que `SiteswapVisualizer` s'affiche quand même

3. **Test priorité**:
   - Figure avec `gif_url` → Affiche GIF caché
   - Figure avec `image_url` mais pas `gif_url` → Affiche image custom
   - Figure avec siteswap mais pas `gif_url` → Génération dynamique

---

## Rollback Procédure

Si des problèmes surviennent:

### Rollback SQL

```sql
-- Supprimer la colonne gif_url
ALTER TABLE `Figures` DROP COLUMN `gif_url`;
DROP INDEX `idx_gif_url` ON `Figures`;
```

### Rollback Code (Git)

```bash
# Revenir au commit précédent
git log --oneline  # Trouver le hash du commit avant implémentation
git revert <commit-hash>

# Ou revenir au fichier spécifique
git checkout HEAD~1 -- backend/src/models/Figure.js
git checkout HEAD~1 -- backend/src/services/FigureService.js
```

### Rollback Docker

```bash
# Supprimer le volume gif_cache
docker-compose down
docker volume rm cirque-app_gif_cache
```

---

## Performance Attendue

### Avant Implémentation

- **Chargement 20 figures**: 40-100 secondes
- **Appels API JugglingLab**: 20 appels/page
- **Expérience utilisateur**: Spinners, attente prolongée

### Après Implémentation

- **Chargement 20 figures**: <1 seconde
- **Appels API JugglingLab**: 0 appels/page
- **Expérience utilisateur**: Chargement instantané
- **Amélioration**: **95%+ réduction** du temps de chargement

### Métriques de Succès

- ✅ 0 erreur lors de la création/modification de figures
- ✅ 100% des figures avec siteswap ont un `gif_url` (après backfill)
- ✅ Temps de chargement page catalogue < 1 seconde
- ✅ Aucun appel vers `jugglinglab.org` après première génération

---

## Troubleshooting

### Problème: GIF non généré lors de la création

**Symptôme**: Figure créée mais `gif_url` est `null`

**Causes possibles**:
1. Siteswap invalide
2. JugglingLab API indisponible
3. Timeout (>15s)

**Solution**:
```bash
# Vérifier les logs
tail -f backend/server.log | grep "JugglingLab"

# Régénérer manuellement
node scripts/backfill-gifs.js --figureId=123
```

### Problème: Erreur 404 sur `/gifs/XXX.gif`

**Symptôme**: Requête vers `/gifs/5-abc.gif` retourne 404

**Causes possibles**:
1. Fichier GIF manquant
2. Permissions filesystem
3. Serveur statique non configuré

**Solution**:
```bash
# Vérifier le fichier existe
ls backend/public/gifs/5-*.gif

# Vérifier permissions
chmod 755 backend/public/gifs
chmod 644 backend/public/gifs/*.gif

# Redémarrer backend
docker-compose restart backend
```

### Problème: GIFs non persistés après redémarrage Docker

**Symptôme**: GIFs disparaissent après `docker-compose down`

**Causes possibles**:
1. Volume `gif_cache` non monté
2. Volume supprimé avec `-v` flag

**Solution**:
```bash
# Vérifier volumes
docker volume ls | grep gif

# Recréer volume
docker-compose up -d

# Régénérer GIFs
docker-compose exec backend node scripts/backfill-gifs.js
```

### Problème: Génération lente lors du seed

**Symptôme**: `npm run reset-and-seed` prend plusieurs minutes

**Solution**:
- **Normal** pour première exécution (génération GIFs)
- Attendu: ~1-2 secondes par GIF
- 15 figures avec siteswap = ~30 secondes supplémentaires

**Optimisation future**:
- Générer en parallèle (batch processing)
- Cache local des siteswaps standards

---

## Maintenance

### Nettoyage des GIFs Orphelins

```bash
# Script manuel pour supprimer GIFs sans figure associée
cd backend
node scripts/cleanup-orphaned-gifs.js  # À CRÉER si besoin
```

### Monitoring de l'Espace Disque

```bash
# Vérifier taille du cache
du -sh backend/public/gifs/

# Docker volume
docker system df -v | grep gif_cache
```

**Espace attendu**:
- 50-200KB par GIF
- 100 figures = ~5-20MB
- Négligeable sur disque moderne

---

## Documentation Technique

### Architecture du Service

```
User Request → Frontend (FigureCard)
                    ↓
            Vérifie figure.gif_url existe?
                    ↓
        OUI → GET /gifs/123-abc.gif (instantané)
        NON → <SiteswapVisualizer> (fallback 2-5s)

Backend (Figure Creation)
    → FigureService.createFigureWithEtapes()
    → JugglingLabService.generateAndCacheGif()
        → Fetch https://jugglinglab.org/anim?pattern=531
        → Save to public/gifs/123-abc.gif
        → Return /gifs/123-abc.gif
    → Update figure.gif_url in DB
```

### Naming Convention

- **Pattern**: `{figureId}-{md5Hash}.gif`
- **Example**: `5-098f6bcd.gif` (Figure ID 5, MD5 hash du siteswap)
- **Avantages**:
  - Évite collisions
  - Auto-invalidation si siteswap change
  - Facile à debugger (ID visible)

### API Endpoints Impactés

- `POST /api/admin/figures` - Génère GIF automatiquement
- `PUT /api/admin/figures/:id` - Régénère si siteswap changé
- `POST /api/prof/figures` - Génère GIF automatiquement
- `PUT /api/prof/figures/:id` - Régénère si siteswap changé

**Nouveau endpoint** (optionnel, non implémenté):
- `POST /api/admin/figures/:id/regenerate-gif` - Force régénération

---

## Questions Fréquentes

**Q: Que se passe-t-il si JugglingLab est down?**
A: La figure est créée quand même avec `gif_url = null`. Le frontend affiche le fallback dynamique.

**Q: Peut-on forcer la régénération d'un GIF?**
A: Oui, via script: `node scripts/backfill-gifs.js --force --figureId=5`

**Q: Les GIFs sont-ils sauvegardés avec la DB?**
A: Non, ils sont dans un volume Docker séparé. Sauvegarder avec `docker volume backup`.

**Q: Peut-on personnaliser les options JugglingLab?**
A: Oui, modifier `fps`, `height`, `width` dans `JugglingLabService.js` ligne 59.

**Q: Et si on veut CDN pour les GIFs?**
A: Hors scope v1. Future: uploader vers S3/CloudFront après génération.

---

## Prochaines Étapes (Post-Déploiement)

1. **Monitoring**: Surveiller logs pour échecs génération
2. **Optimisation**: Ajuster `fps` si GIFs trop lourds
3. **Analytics**: Mesurer réduction temps chargement
4. **Feedback**: Collecter retours utilisateurs

---

## Support

En cas de problème, consulter:
- **Logs Backend**: `backend/server.log`
- **Logs Docker**: `docker-compose logs backend -f`
- **Documentation API**: `backend/docs/API_DOCUMENTATION.md`
- **Changelog**: `backend/docs/INTEGRATION_LOG.md`

**Contact**: Équipe Dev Cirque App
