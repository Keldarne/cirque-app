/**
 * Seed Module: Catalogue Public
 * Création du catalogue partagé par toutes les écoles:
 * - Disciplines (globales, pas de ecole_id)
 * - Figures publiques (ecole_id = NULL, visibilite = 'public')
 */

const { Discipline, Figure, EtapeProgression } = require('../../src/models');
const logger = require('../utils/logger');
const figuresData = require('../data/figures');

/**
 * Disciplines de cirque (globales, sans ecole_id)
 * Extraites automatiquement depuis figures.js
 */
const DISCIPLINES = [...new Set(figuresData.map(f => f.discipline))];


/**
 * Seed du catalogue public
 */
async function seedCataloguePublic() {
  logger.section('Seeding Catalogue Public (Partagé)');

  const catalogueData = {
    disciplines: [],
    disciplineMap: {},
    figures: [],
    figuresByDiscipline: {}
  };

  try {
    // 1. Créer disciplines (globales, pas de ecole_id)
    logger.info('📚 Création disciplines...');
    for (const nomDiscipline of DISCIPLINES) {
      const discipline = await Discipline.create({ nom: nomDiscipline });
      catalogueData.disciplines.push(discipline);
      catalogueData.disciplineMap[nomDiscipline] = discipline;
      logger.success(`  ✓ ${nomDiscipline}`);
    }

    // 2. Créer figures publiques depuis figures.js (ecole_id = NULL, visibilite = 'public')
    logger.info('\n🎯 Création figures publiques depuis figures.js...');

    // Grouper les figures par discipline
    const figuresByDisciplineName = {};
    for (const figureData of figuresData) {
      if (!figuresByDisciplineName[figureData.discipline]) {
        figuresByDisciplineName[figureData.discipline] = [];
      }
      figuresByDisciplineName[figureData.discipline].push(figureData);
    }

    for (const [disciplineName, figures] of Object.entries(figuresByDisciplineName)) {
      const discipline = catalogueData.disciplineMap[disciplineName];
      if (!discipline) {
        logger.warn(`  ⚠️ Discipline non trouvée: ${disciplineName}`);
        continue;
      }

      for (const figureData of figures) {
        const figure = await Figure.create({
          nom: figureData.nom,
          descriptif: figureData.descriptif,
          difficulty_level: figureData.difficulty_level || 1,
          type: figureData.type || 'artistique',
          discipline_id: discipline.id,
          ecole_id: null,  // Public = pas d'école
          visibilite: 'public',
          createur_id: null  // Catalogue système
        });

        // Créer étapes de progression depuis figureData.steps ou étapes par défaut
        if (figureData.steps && figureData.steps.length > 0) {
          for (let i = 0; i < figureData.steps.length; i++) {
            await EtapeProgression.create({
              figure_id: figure.id,
              ordre: i + 1,
              titre: `Étape ${i + 1}`,
              description: figureData.steps[i],
              xp: 5 + (i * 5)
            });
          }
        } else {
          // Étapes par défaut si non spécifiées
          await EtapeProgression.create({
            figure_id: figure.id,
            ordre: 1,
            titre: 'Découverte',
            description: 'Comprendre la technique de base',
            xp: 5
          });

          await EtapeProgression.create({
            figure_id: figure.id,
            ordre: 2,
            titre: 'Pratique',
            description: 'Entraînement avec assistance',
            xp: 10
          });

          await EtapeProgression.create({
            figure_id: figure.id,
            ordre: 3,
            titre: 'Maîtrise',
            description: 'Réalisation autonome - 3 fois consécutives',
            xp: 20
          });
        }

        catalogueData.figures.push(figure);

        // Grouper par discipline pour seedProgressions
        if (!catalogueData.figuresByDiscipline[disciplineName]) {
          catalogueData.figuresByDiscipline[disciplineName] = [];
        }
        catalogueData.figuresByDiscipline[disciplineName].push(figure);
      }
      logger.success(`  ✓ ${disciplineName}: ${figures.length} figures`);
    }

    logger.section('✅ Catalogue Public créé');
    logger.info(`  - ${catalogueData.disciplines.length} disciplines`);
    logger.info(`  - ${catalogueData.figures.length} figures publiques\n`);

    return catalogueData;

  } catch (error) {
    logger.error(`Erreur lors du seed du catalogue: ${error.message}`);
    throw error;
  }
}

/**
 * Crée des figures école-spécifiques pour tester l'isolation multi-tenant
 * @param {Object} ecoles - Object contenant voltige et academie
 * @param {Object} disciplineMap - Map des disciplines par nom
 * @returns {Object} schoolFigures avec tableaux voltige et academie
 */
async function createSchoolSpecificFigures(ecoles, disciplineMap) {
  logger.info('\n🏫 Création figures école-spécifiques...');

  const { Discipline } = require('../../src/models');
  const schoolFigures = { voltige: [], academie: [] };

  const getDisciplineId = async (name) => {
    if (disciplineMap[name]) return disciplineMap[name].id;
    // Fallback: search or create
    const [d] = await Discipline.findOrCreate({ where: { nom: name } });
    disciplineMap[name] = d;
    return d.id;
  };

  try {
    // École Voltige: 2 figures
    const voltigeSpecs = [
      {
        nom: 'Pyramide Humaine École',
        descriptif: 'Figure spécifique à l\'École Voltige pour acrobatie en groupe. Technique exclusive de construction pyramidale enseignée selon la méthode maison.',
        discipline: 'Acrobatie',
        difficulty_level: 4,
        type: 'artistique'
      },
      {
        nom: 'Jonglage Feu - Technique Voltige',
        descriptif: 'Méthode propriétaire de l\'école pour le jonglage de feu. Approche sécuritaire et progressive développée par l\'École Voltige.',
        discipline: 'Jonglage',
        difficulty_level: 5,
        type: 'artistique'
      }
    ];

    for (const spec of voltigeSpecs) {
      const disciplineId = await getDisciplineId(spec.discipline);
      const figure = await Figure.create({
        nom: spec.nom,
        descriptif: spec.descriptif,
        difficulty_level: spec.difficulty_level,
        type: spec.type,
        discipline_id: disciplineId,
        ecole_id: ecoles.voltige.id,
        visibilite: 'ecole',
        createur_id: null  // Catalogue école
      });

      // 3 étapes standard
      await EtapeProgression.bulkCreate([
        {
          figure_id: figure.id,
          ordre: 1,
          titre: 'Découverte',
          description: 'Comprendre la technique',
          xp: 5
        },
        {
          figure_id: figure.id,
          ordre: 2,
          titre: 'Pratique',
          description: 'Entraînement assisté',
          xp: 10
        },
        {
          figure_id: figure.id,
          ordre: 3,
          titre: 'Maîtrise',
          description: 'Réalisation autonome',
          xp: 20
        }
      ]);

      schoolFigures.voltige.push(figure);
    }

    // Académie: 2 figures
    const academieSpecs = [
      {
        nom: 'Contorsion Aérienne Avancée',
        descriptif: 'Technique exclusive de l\'Académie combinant tissu aérien et contorsion. Programme avancé réservé aux élèves de l\'Académie.',
        discipline: 'Aérien',
        difficulty_level: 5,
        type: 'artistique'
      },
      {
        nom: 'Acrobatie Portée - Méthode Académie',
        descriptif: 'Portés acrobatiques selon la pédagogie de l\'Académie. Technique de partenaires développée en exclusivité pour nos élèves.',
        discipline: 'Acrobatie',
        difficulty_level: 4,
        type: 'artistique'
      }
    ];

    for (const spec of academieSpecs) {
      const disciplineId = await getDisciplineId(spec.discipline);
      const figure = await Figure.create({
        nom: spec.nom,
        descriptif: spec.descriptif,
        difficulty_level: spec.difficulty_level,
        type: spec.type,
        discipline_id: disciplineId,
        ecole_id: ecoles.academie.id,
        visibilite: 'ecole',
        createur_id: null  // Catalogue école
      });

      // 3 étapes standard
      await EtapeProgression.bulkCreate([
        {
          figure_id: figure.id,
          ordre: 1,
          titre: 'Découverte',
          description: 'Comprendre la technique',
          xp: 5
        },
        {
          figure_id: figure.id,
          ordre: 2,
          titre: 'Pratique',
          description: 'Entraînement assisté',
          xp: 10
        },
        {
          figure_id: figure.id,
          ordre: 3,
          titre: 'Maîtrise',
          description: 'Réalisation autonome',
          xp: 20
        }
      ]);

      schoolFigures.academie.push(figure);
    }

    logger.success(`  ✓ École Voltige: ${schoolFigures.voltige.length} figures`);
    logger.success(`  ✓ Académie: ${schoolFigures.academie.length} figures`);

    return schoolFigures;

  } catch (error) {
    logger.error(`Erreur création figures école-spécifiques: ${error.message}`);
    throw error;
  }
}

module.exports = { seedCataloguePublic, createSchoolSpecificFigures };
