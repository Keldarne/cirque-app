/**
 * Seed des exercices décomposés
 * Crée les relations entre figures (récursif)
 * Une figure avancée a besoin d'autres figures comme prérequis
 *
 * IMPORTANT: Utilise les VRAIS noms de figures de la base de données
 */

const { Figure, FigurePrerequis } = require('../../src/models');

/**
 * Définition des relations exercices pour chaque figure
 * Structure: { figure: 'nom', exercices: [{ nom, ordre, poids, est_requis }] }
 */
const exercicesDecomposesData = [
  // ═══════════════════════════════════════════════════════════════════
  // RENFORCEMENT - Progressions logiques
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Tractions',
    exercices: [
      { nom: 'Pompes', ordre: 1, poids: 2, est_requis: true },
      { nom: 'Gainage planche', ordre: 2, poids: 2, est_requis: true }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // BALLES - Progression jonglage
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Fontaine 3 balles',
    exercices: [
      { nom: 'Cascade 3 balles', ordre: 1, poids: 3, est_requis: true }
    ]
  },

  {
    figure: 'Mills Mess',
    exercices: [
      { nom: 'Cascade 3 balles', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Fontaine 3 balles', ordre: 2, poids: 2, est_requis: true }
    ]
  },

  {
    figure: 'Cascade 4 balles',
    exercices: [
      { nom: 'Cascade 3 balles', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Fontaine 3 balles', ordre: 2, poids: 3, est_requis: true },
      { nom: 'Pompes', ordre: 3, poids: 1, est_requis: false }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // MASSUES
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Jonglage 3 massues',
    exercices: [
      { nom: 'Cascade 3 balles', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Pompes', ordre: 2, poids: 2, est_requis: true }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // ACROBATIE - Progression au sol
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Roue',
    exercices: [
      { nom: 'Roulade avant', ordre: 1, poids: 2, est_requis: true },
      { nom: 'ATR (Appui Tendu Renversé)', ordre: 2, poids: 3, est_requis: true }
    ]
  },

  {
    figure: 'Flip avant',
    exercices: [
      { nom: 'Roulade avant', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Squats', ordre: 2, poids: 3, est_requis: true },
      { nom: 'Abdominaux', ordre: 3, poids: 2, est_requis: true }
    ]
  },

  {
    figure: 'Flip arrière',
    exercices: [
      { nom: 'Roulade avant', ordre: 1, poids: 2, est_requis: true },
      { nom: 'Flip avant', ordre: 2, poids: 3, est_requis: true },
      { nom: 'Squats', ordre: 3, poids: 3, est_requis: true },
      { nom: 'Abdominaux', ordre: 4, poids: 2, est_requis: true }
    ]
  },

  {
    figure: 'ATR (Appui Tendu Renversé)',
    exercices: [
      { nom: 'Pompes', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Gainage planche', ordre: 2, poids: 3, est_requis: true }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // TRAPÈZE - Progression
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Planche trapèze',
    exercices: [
      { nom: 'Suspension trapèze', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Gainage planche', ordre: 2, poids: 3, est_requis: true },
      { nom: 'Pompes', ordre: 3, poids: 2, est_requis: true }
    ]
  },

  {
    figure: 'Salto trapèze',
    exercices: [
      { nom: 'Suspension trapèze', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Planche trapèze', ordre: 2, poids: 2, est_requis: true },
      { nom: 'Abdominaux', ordre: 3, poids: 2, est_requis: true }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // CORDE & TISSU AÉRIEN
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Tissu aérien - Enroulé',
    exercices: [
      { nom: 'Montée de corde', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Tractions', ordre: 2, poids: 3, est_requis: true }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // ÉQUILIBRE - Progression
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Monocycle basique',
    exercices: [
      { nom: 'Squats', ordre: 1, poids: 2, est_requis: true }
    ]
  },

  {
    figure: 'Boule d\'équilibre',
    exercices: [
      { nom: 'Squats', ordre: 1, poids: 3, est_requis: true },
      { nom: 'Gainage planche', ordre: 2, poids: 2, est_requis: true }
    ]
  },

  {
    figure: 'Rola Bola',
    exercices: [
      { nom: 'Boule d\'équilibre', ordre: 1, poids: 2, est_requis: false },
      { nom: 'Squats', ordre: 2, poids: 3, est_requis: true },
      { nom: 'Gainage planche', ordre: 3, poids: 2, est_requis: true }
    ]
  },

  {
    figure: 'Échasses',
    exercices: [
      { nom: 'Squats', ordre: 1, poids: 2, est_requis: true }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // JONGLERIE SPÉCIALISÉE
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Bâton du diable',
    exercices: [
      { nom: 'Cascade 3 balles', ordre: 1, poids: 2, est_requis: false }
    ]
  },

  {
    figure: 'Diabolo lancer',
    exercices: [
      { nom: 'Pompes', ordre: 1, poids: 1, est_requis: false }
    ]
  },

  {
    figure: 'Poi spinning',
    exercices: [
      { nom: 'Cascade 3 balles', ordre: 1, poids: 2, est_requis: false }
    ]
  },

  {
    figure: 'Assiettes chinoises',
    exercices: [
      { nom: 'Cascade 3 balles', ordre: 1, poids: 1, est_requis: false }
    ]
  },

  {
    figure: 'Contact staff',
    exercices: [
      { nom: 'Bâton du diable', ordre: 1, poids: 2, est_requis: false },
      { nom: 'Gainage planche', ordre: 2, poids: 2, est_requis: true }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════
  // THÉÂTRE & COMÉDIE
  // ═══════════════════════════════════════════════════════════════════

  {
    figure: 'Gag de chute',
    exercices: [
      { nom: 'Roulade avant', ordre: 1, poids: 2, est_requis: true }
    ]
  },

  {
    figure: 'Numéro solo',
    exercices: [
      { nom: 'Improvisation comique', ordre: 1, poids: 2, est_requis: true },
      { nom: 'Mime - Mur invisible', ordre: 2, poids: 1, est_requis: false }
    ]
  }
];

/**
 * Fonction principale de seed
 */
async function seedExercicesDecomposes() {
  console.log('\n' + '═'.repeat(60));
  console.log('  📎 SEED: Exercices Décomposés (Relations Récursives)');
  console.log('═'.repeat(60));

  try {
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const figureData of exercicesDecomposesData) {
      const { figure: figureNom, exercices } = figureData;

      // 1. Récupérer la figure parente
      const figureParente = await Figure.findOne({
        where: { nom: figureNom },
        attributes: ['id', 'nom']
      });

      if (!figureParente) {
        console.log(`⚠️  Figure parente non trouvée: ${figureNom}`);
        errorCount++;
        continue;
      }

      // 2. Pour chaque exercice, créer la relation
      for (const exerciceData of exercices) {
        const { nom: exerciceNom, ordre, poids, est_requis } = exerciceData;

        // Trouver la figure qui sert d'exercice
        const figureExercice = await Figure.findOne({
          where: { nom: exerciceNom },
          attributes: ['id', 'nom']
        });

        if (!figureExercice) {
          console.log(`⚠️  Figure exercice non trouvée: ${exerciceNom} (pour ${figureNom})`);
          errorCount++;
          continue;
        }

        // Vérifier si la relation existe déjà
        const existeDeja = await FigurePrerequis.findOne({
          where: {
            figure_id: figureParente.id,
            exercice_figure_id: figureExercice.id
          }
        });

        if (existeDeja) {
          skipCount++;
          continue;
        }

        // Créer la relation
        try {
          await FigurePrerequis.create({
            figure_id: figureParente.id,
            exercice_figure_id: figureExercice.id,
            ordre,
            poids,
            est_requis
          });

          successCount++;
        } catch (error) {
          console.log(`❌ Erreur création relation: ${figureNom} → ${exerciceNom}`);
          console.log(`   ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('─'.repeat(60));
    console.log(`✅ Exercices décomposés créés: ${successCount}`);
    if (skipCount > 0) {
      console.log(`⏭️  Relations déjà existantes: ${skipCount}`);
    }
    if (errorCount > 0) {
      console.log(`⚠️  Warnings (figures non trouvées): ${errorCount}`);
    }

    // Afficher statistiques
    const totalRelations = await FigurePrerequis.count();
    const figuresAvecExercices = await FigurePrerequis.count({
      distinct: true,
      col: 'figure_id'
    });

    console.log('─'.repeat(60));
    console.log(`📊 Total relations dans la base: ${totalRelations}`);
    console.log(`📚 Figures avec exercices décomposés: ${figuresAvecExercices}`);

    // Message encourageant si succès
    if (successCount > 0) {
      console.log('\n💡 Le système de suggestions intelligentes est maintenant opérationnel!');
      console.log('   Les élèves verront des recommandations personnalisées basées sur leur progression.');
    }

  } catch (error) {
    console.error('❌ Erreur fatale lors du seed des exercices décomposés:', error);
    throw error;
  }
}

module.exports = seedExercicesDecomposes;
