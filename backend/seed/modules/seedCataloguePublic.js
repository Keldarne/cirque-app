/**
 * Seed Module: Catalogue Public
 * Création du catalogue partagé par toutes les écoles:
 * - Disciplines (globales, pas de ecole_id)
 * - Figures publiques (ecole_id = NULL, visibilite = 'public')
 */

const { Discipline, Figure, EtapeProgression } = require('../../src/models');
const logger = require('../utils/logger');

/**
 * Disciplines de cirque (globales, sans ecole_id)
 */
const DISCIPLINES = [
  'Jonglage',
  'Acrobatie',
  'Aérien',
  'Équilibre',
  'Manipulation d\'Objets',
  'Clown/Expression',
  'Renforcement Musculaire'
];

/**
 * Figures publiques par discipline (5 par discipline)
 */
const FIGURES_PUBLIQUES = {
  'Jonglage': [
    { nom: 'Cascade 3 balles', descriptif: 'Pattern de base du jonglage à 3 balles. Motif asymétrique fondamental qui développe la coordination bilatérale, le timing et la trajectoire parabolique des objets.', difficulty_level: 2, type: 'artistique' },
    { nom: 'Fontaine 3 balles', descriptif: 'Pattern synchrone à 3 balles où les deux mains lancent en même temps. Développe la coordination symétrique et le contrôle simultané des deux côtés du corps.', difficulty_level: 2, type: 'artistique' },
    { nom: 'Cascade 4 balles', descriptif: 'Pattern avancé qui double la cascade en synchronisant deux cascades à 2 balles. Exige précision absolue et dissociation des mains pour maintenir deux rythmes indépendants.', difficulty_level: 4, type: 'artistique' },
    { nom: 'Mills Mess', descriptif: 'Pattern complexe qui entrelace les bras en croisant devant le corps. Figure artistique qui ajoute une dimension visuelle spectaculaire à la cascade classique.', difficulty_level: 4, type: 'artistique' },
    { nom: 'Jonglage 3 massues', descriptif: 'Cascade avec des massues - objets longs qui tournent en l\'air. Développe la précision des lancers rotatifs et la lecture des rotations pour la réception.', difficulty_level: 3, type: 'artistique' }
  ],
  'Acrobatie': [
    { nom: 'Roulade avant', descriptif: 'Mouvement de base qui enseigne à rouler en toute sécurité sur le dos. Fondamental pour la protection lors des chutes et base de tous les mouvements acrobatiques.', difficulty_level: 1, type: 'artistique' },
    { nom: 'Roue', descriptif: 'Rotation latérale du corps avec passage par l\'appui manuel. Développe la force des bras, la coordination et l\'orientation spatiale en position inversée.', difficulty_level: 2, type: 'artistique' },
    { nom: 'ATR (Appui Tendu Renversé)', descriptif: 'Équilibre vertical sur les mains, fondamental en acrobatie et gymnastique. Développe la force des épaules, l\'alignement corporel et le contrôle de l\'équilibre inversé.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Flip avant', descriptif: 'Salto avant complet - rotation aérienne vers l\'avant avec réception sur les pieds. Figure avancée qui exige force explosive, conscience spatiale et courage.', difficulty_level: 5, type: 'artistique' },
    { nom: 'Flip arrière', descriptif: 'Salto arrière complet - rotation aérienne vers l\'arrière. Figure de haut niveau qui demande confiance, impulsion verticale puissante et orientation spatiale en aveugle.', difficulty_level: 5, type: 'artistique' }
  ],
  'Aérien': [
    { nom: 'Montée de corde', descriptif: 'Technique de grimpe à la corde lisse sans utiliser les pieds. Développe la force de préhension, des bras et du tronc - base de tous les agrès aériens.', difficulty_level: 2, type: 'artistique' },
    { nom: 'Suspension trapèze', descriptif: 'Maintien en suspension sous la barre de trapèze par les mains. Développe la force de préhension, l\'endurance des avant-bras et la résistance mentale.', difficulty_level: 2, type: 'artistique' },
    { nom: 'Planche trapèze', descriptif: 'Figure d\'équilibre horizontal sur la barre de trapèze. Exige force du tronc exceptionnelle et alignement corporel parfait pour maintenir la position.', difficulty_level: 4, type: 'artistique' },
    { nom: 'Salto trapèze', descriptif: 'Rotation aérienne complète au trapèze volant avec réception par un porteur. Figure spectaculaire qui combine timing parfait, courage et confiance en son partenaire.', difficulty_level: 5, type: 'artistique' },
    { nom: 'Tissu aérien - Enroulé', descriptif: 'Figure d\'enroulement dans les tissus aériens pour créer des points d\'ancrage. Technique de base essentielle qui permet ensuite de réaliser toutes les figures suspendues.', difficulty_level: 3, type: 'artistique' }
  ],
  'Équilibre': [
    { nom: 'Marche sur fil', descriptif: 'Marche sur fil de fer tendu - exercice d\'équilibre dynamique fondamental. Développe la proprioception, le contrôle postural fin et la concentration mentale.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Monocycle basique', descriptif: 'Rouler en monocycle en ligne droite. Développe l\'équilibre latéral et antéro-postérieur simultanément avec coordination des jambes et du bassin.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Boule d\'équilibre', descriptif: 'Maintien de l\'équilibre sur une grosse boule instable. Exige ajustements constants, force des chevilles et jambes, et excellent sens de l\'équilibre.', difficulty_level: 4, type: 'artistique' },
    { nom: 'Rola Bola', descriptif: 'Équilibre sur une planche posée sur un cylindre roulant. Développe l\'équilibre dynamique multidirectionnel et les réflexes de rattrapage.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Échasses', descriptif: 'Marche surélevée sur échasses. Développe l\'équilibre en hauteur, la confiance et la coordination avec extension du schéma corporel.', difficulty_level: 2, type: 'artistique' }
  ],
  'Manipulation d\'Objets': [
    { nom: 'Bâton du diable', descriptif: 'Manipulation d\'un bâton central avec deux baguettes de contrôle. Développe la coordination bilatérale, le timing et la fluidité des mouvements.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Diabolo lancer', descriptif: 'Lancer et rattrapage du diabolo en hauteur. Figure spectaculaire qui exige timing précis, lecture de trajectoire et confiance.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Poi spinning', descriptif: 'Rotation de poi (balles sur cordes) en cercles et spirales. Développe la coordination circulaire, le sens du rythme et la fluidité gestuelle.', difficulty_level: 2, type: 'artistique' },
    { nom: 'Assiettes chinoises', descriptif: 'Faire tourner des assiettes sur des baguettes par rotation continue. Exercice d\'équilibre dynamique d\'objets qui développe le toucher délicat.', difficulty_level: 2, type: 'artistique' },
    { nom: 'Contact staff', descriptif: 'Manipulation d\'un bâton en contact constant avec le corps sans le saisir. Art de la manipulation par équilibre qui développe le toucher et la fluidité.', difficulty_level: 4, type: 'artistique' }
  ],
  'Clown/Expression': [
    { nom: 'Improvisation comique', descriptif: 'Jeu clownesque spontané qui développe la créativité, l\'écoute du partenaire et l\'acceptation de l\'échec comme source d\'humour.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Mime - Mur invisible', descriptif: 'Technique de mime classique qui crée l\'illusion d\'un mur. Développe la précision gestuelle et la capacité à créer l\'imaginaire par le corps.', difficulty_level: 2, type: 'artistique' },
    { nom: 'Gag de chute', descriptif: 'Chute comique contrôlée et sécuritaire. Enseigne à transformer les accidents en moments comiques tout en protégeant son corps.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Jeu masqué', descriptif: 'Expression corporelle avec masque neutre. Développe l\'expression par le corps entier quand le visage est caché, amplification des gestes.', difficulty_level: 3, type: 'artistique' },
    { nom: 'Numéro solo', descriptif: 'Création d\'un numéro personnel complet. Synthèse des compétences techniques et artistiques pour raconter une histoire ou transmettre une émotion.', difficulty_level: 4, type: 'artistique' }
  ],
  'Renforcement Musculaire': [
    { nom: 'Gainage planche', descriptif: 'Maintien de la position planche horizontale. Exercice de base qui renforce le tronc, les épaules et développe la stabilité centrale nécessaire à tous les agrès.', difficulty_level: 2, type: 'renforcement' },
    { nom: 'Pompes', descriptif: 'Renforcement des pectoraux, triceps et épaules. Exercice fondamental qui développe la force de poussée nécessaire aux acrobaties et agrès.', difficulty_level: 2, type: 'renforcement' },
    { nom: 'Squats', descriptif: 'Flexion-extension des jambes qui renforce quadriceps, fessiers et ischio-jambiers. Base de la puissance explosive pour les sauts et acrobaties.', difficulty_level: 2, type: 'renforcement' },
    { nom: 'Tractions', descriptif: 'Renforcement du dos, biceps et avant-bras par traction du corps. Essentiel pour tous les agrès aériens et la grimpe.', difficulty_level: 3, type: 'renforcement' },
    { nom: 'Abdominaux', descriptif: 'Renforcement de la sangle abdominale. Développe la stabilité du tronc nécessaire pour protéger le dos et contrôler les rotations en acrobatie.', difficulty_level: 2, type: 'renforcement' }
  ]
};


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

    // 2. Créer figures publiques (ecole_id = NULL, visibilite = 'public')
    logger.info('\n🎯 Création figures publiques...');
    for (const [disciplineName, figures] of Object.entries(FIGURES_PUBLIQUES)) {
      const discipline = catalogueData.disciplineMap[disciplineName];
      for (const figureData of figures) {
        const figure = await Figure.create({
          ...figureData,
          discipline_id: discipline.id,
          ecole_id: null,  // Public = pas d'école
          visibilite: 'public',
          createur_id: null  // Catalogue système
        });

        // Créer étapes de progression basiques pour chaque figure
        await EtapeProgression.create({
          figure_id: figure.id,
          ordre: 1,
          titre: 'Découverte',
          description: 'Comprendre la technique de base', xp: 5,
          
        });

        await EtapeProgression.create({
          figure_id: figure.id,
          ordre: 2,
          titre: 'Pratique',
          description: 'Entraînement avec assistance', xp: 10,
          
        });

        await EtapeProgression.create({
          figure_id: figure.id,
          ordre: 3,
          titre: 'Maîtrise',
          description: 'Réalisation autonome - 3 fois consécutives', xp: 20,
          
        });

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

  const schoolFigures = { voltige: [], academie: [] };

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
      const figure = await Figure.create({
        nom: spec.nom,
        descriptif: spec.descriptif,
        difficulty_level: spec.difficulty_level,
        type: spec.type,
        discipline_id: disciplineMap[spec.discipline].id,
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
      const figure = await Figure.create({
        nom: spec.nom,
        descriptif: spec.descriptif,
        difficulty_level: spec.difficulty_level,
        type: spec.type,
        discipline_id: disciplineMap[spec.discipline].id,
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
