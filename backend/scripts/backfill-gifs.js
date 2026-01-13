/**
 * Script de Backfill: Générer les GIFs JugglingLab pour les figures existantes
 *
 * Ce script parcourt toutes les figures avec metadata.siteswap et génère
 * les GIFs cachés pour améliorer les performances de chargement.
 *
 * Usage:
 *   node scripts/backfill-gifs.js              # Process figures sans gif_url
 *   node scripts/backfill-gifs.js --force      # Régénérer tous les GIFs
 *   node scripts/backfill-gifs.js --figureId=42 # Process une figure spécifique
 *
 * Options:
 *   --force        Régénère tous les GIFs même si gif_url existe
 *   --figureId=N   Traite uniquement la figure avec l'ID spécifié
 */

require('dotenv').config();
const { Figure } = require('../src/models');
const JugglingLabService = require('../src/services/JugglingLabService');
const { Op } = require('sequelize');

// Configuration
const BATCH_SIZE = 10; // Nombre de figures à traiter simultanément
const DELAY_BETWEEN_BATCHES = 2000; // Délai en ms entre les batchs (évite rate limiting)

/**
 * Fonction principale de backfill
 */
async function backfillGifs(options = {}) {
  const { force = false, figureId = null } = options;

  try {
    console.log('\n=== 🎨 JugglingLab GIF Backfill ===\n');

    // Construire la requête
    const where = {
      metadata: {
        [Op.ne]: null
      }
    };

    // Option: Traiter une figure spécifique
    if (figureId) {
      where.id = parseInt(figureId);
      console.log(`🎯 Mode: Figure spécifique (ID: ${figureId})`);
    }

    // Option: Ne traiter que les figures sans gif_url (sauf si --force)
    if (!force) {
      where.gif_url = null;
      console.log('📋 Mode: Seulement figures sans gif_url');
    } else {
      console.log('⚡ Mode: Force (régénération complète)');
    }

    // Récupérer les figures
    const figures = await Figure.findAll({
      where,
      attributes: ['id', 'nom', 'metadata', 'gif_url'],
      order: [['id', 'ASC']]
    });

    // Filtrer uniquement celles avec siteswap
    const figuresWithSiteswap = figures.filter(f => f.metadata?.siteswap);

    console.log(`\n📊 Statistiques:`);
    console.log(`   Total figures trouvées: ${figures.length}`);
    console.log(`   Figures avec siteswap: ${figuresWithSiteswap.length}`);
    console.log(`   Taille batch: ${BATCH_SIZE}`);
    console.log(`   Délai entre batchs: ${DELAY_BETWEEN_BATCHES}ms\n`);

    if (figuresWithSiteswap.length === 0) {
      console.log('✅ Aucune figure à traiter. Terminé.\n');
      return;
    }

    // Statistiques de résultats
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    // Traiter par batchs
    const totalBatches = Math.ceil(figuresWithSiteswap.length / BATCH_SIZE);

    for (let i = 0; i < figuresWithSiteswap.length; i += BATCH_SIZE) {
      const batch = figuresWithSiteswap.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      console.log(`\n--- 📦 Batch ${batchNumber}/${totalBatches} (${batch.length} figures) ---`);

      for (const figure of batch) {
        const figureLabel = `Figure ${figure.id}: "${figure.nom}" (${figure.metadata.siteswap})`;

        try {
          console.log(`\n🔄 ${figureLabel}`);

          // Si --force et que gif_url existe déjà, supprimer l'ancien
          if (force && figure.gif_url) {
            console.log(`   🗑️  Suppression ancien GIF: ${figure.gif_url}`);
            await JugglingLabService.deleteCachedGif(figure.gif_url);
          }

          // Générer et cacher le GIF
          const gifUrl = await JugglingLabService.generateAndCacheGif(
            figure.id,
            figure.metadata.siteswap,
            { fps: 12, height: 200, width: 300 }
          );

          if (gifUrl) {
            // Mise à jour DB
            await figure.update({ gif_url: gifUrl });
            console.log(`   ✅ Succès: ${gifUrl}`);
            successCount++;
          } else {
            console.log(`   ❌ Échec: Impossible de générer le GIF`);
            failureCount++;
          }
        } catch (error) {
          console.error(`   ❌ Erreur: ${error.message}`);
          failureCount++;
        }
      }

      // Délai entre les batchs (sauf dernier)
      if (i + BATCH_SIZE < figuresWithSiteswap.length) {
        console.log(`\n⏳ Attente de ${DELAY_BETWEEN_BATCHES}ms avant le prochain batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // Résumé final
    console.log('\n\n=== 📊 Résumé du Backfill ===');
    console.log(`✅ Succès:  ${successCount}`);
    console.log(`❌ Échecs:  ${failureCount}`);
    console.log(`📝 Total:   ${successCount + failureCount}`);

    if (successCount > 0) {
      console.log(`\n🎉 ${successCount} GIF(s) généré(s) avec succès!`);
    }
    if (failureCount > 0) {
      console.log(`\n⚠️  ${failureCount} GIF(s) en échec (vérifier logs ci-dessus)`);
    }

    console.log('\n✨ Backfill terminé.\n');

  } catch (error) {
    console.error('\n❌ Erreur fatale lors du backfill:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// ===== PARSING DES ARGUMENTS CLI =====

const args = process.argv.slice(2);

const options = {
  force: args.includes('--force'),
  figureId: args.find(arg => arg.startsWith('--figureId='))?.split('=')[1] || null
};

// Afficher l'aide si demandé
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/backfill-gifs.js [options]

Options:
  --force           Régénère tous les GIFs même si gif_url existe déjà
  --figureId=N      Traite uniquement la figure avec l'ID spécifié
  --help, -h        Affiche cette aide

Exemples:
  node scripts/backfill-gifs.js                  # Figures sans gif_url
  node scripts/backfill-gifs.js --force          # Toutes les figures
  node scripts/backfill-gifs.js --figureId=42    # Figure ID 42 uniquement
`);
  process.exit(0);
}

// Exécuter le backfill
console.log('🚀 Démarrage du backfill JugglingLab GIF...\n');

backfillGifs(options)
  .then(() => {
    console.log('✅ Script terminé avec succès.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur non gérée:', error);
    process.exit(1);
  });
