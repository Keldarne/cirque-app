/**
 * Seed Module: Catalogue Public
 * Création du catalogue partagé par toutes les écoles:
 * - Disciplines (globales, pas de ecole_id)
 * - Figures publiques (ecole_id = NULL, visibilite = 'public')
 * - Badges publics
 * - Titres publics
 * - Défis publics
 */

const { Discipline, Figure, Badge, Titre, Defi, EtapeProgression } = require('../../src/models');
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
 * Badges publics - Matchent le schéma Badge model
 */
const BADGES_PUBLICS = [
  { nom: 'Premier Pas', description: 'Première figure validée', icone: 'trophy', couleur: '#FFC107', categorie: 'progression', condition_type: 'figures_validees', condition_valeur: 1, rarete: 'commun', xp_bonus: 10 },
  { nom: 'Débutant', description: '5 figures validées', icone: 'star', couleur: '#4CAF50', categorie: 'progression', condition_type: 'figures_validees', condition_valeur: 5, rarete: 'commun', xp_bonus: 25 },
  { nom: 'Intermédiaire', description: '20 figures validées', icone: 'stars', couleur: '#2196F3', categorie: 'progression', condition_type: 'figures_validees', condition_valeur: 20, rarete: 'rare', xp_bonus: 50 },
  { nom: 'Avancé', description: '50 figures validées', icone: 'verified', couleur: '#9C27B0', categorie: 'progression', condition_type: 'figures_validees', condition_valeur: 50, rarete: 'epique', xp_bonus: 100 },
  { nom: 'Expert', description: '100 figures validées', icone: 'military_tech', couleur: '#FF5722', categorie: 'progression', condition_type: 'figures_validees', condition_valeur: 100, rarete: 'legendaire', xp_bonus: 250 },
  { nom: 'Jongleur', description: 'Maîtrise du jonglage', icone: 'sports_gymnastics', couleur: '#FF9800', categorie: 'maitrise', condition_type: 'discipline_complete', condition_valeur: 1, rarete: 'rare', xp_bonus: 75 },
  { nom: 'Acrobate', description: 'Maîtrise de l\'acrobatie', icone: 'accessibility_new', couleur: '#E91E63', categorie: 'maitrise', condition_type: 'discipline_complete', condition_valeur: 2, rarete: 'rare', xp_bonus: 75 },
  { nom: 'Séquence 7 jours', description: '7 jours consécutifs', icone: 'local_fire_department', couleur: '#FF5722', categorie: 'streak', condition_type: 'streak_jours', condition_valeur: 7, rarete: 'commun', xp_bonus: 30 },
  { nom: 'Séquence 30 jours', description: '30 jours consécutifs', icone: 'whatshot', couleur: '#F44336', categorie: 'streak', condition_type: 'streak_jours', condition_valeur: 30, rarete: 'rare', xp_bonus: 100 },
  { nom: 'Explorateur', description: 'Testé toutes les disciplines', icone: 'explore', couleur: '#00BCD4', categorie: 'maitrise', condition_type: 'manuel', condition_valeur: 0, rarete: 'rare', xp_bonus: 100 }
];

/**
 * Titres publics - Matchent le schéma Titre model
 */
const TITRES_PUBLICS = [
  { nom: 'Novice', description: 'Débute l\'aventure du cirque', couleur: '#757575', condition_type: 'niveau', condition_valeur: 1, rarete: 'commun' },
  { nom: 'Apprenti Circassien', description: 'Progresse dans les arts du cirque', couleur: '#795548', condition_type: 'niveau', condition_valeur: 2, rarete: 'commun' },
  { nom: 'Artiste en Herbe', description: 'Talent en développement', couleur: '#4CAF50', condition_type: 'niveau', condition_valeur: 5, rarete: 'rare' },
  { nom: 'Circassien Confirmé', description: 'Maîtrise plusieurs disciplines', couleur: '#2196F3', condition_type: 'niveau', condition_valeur: 10, rarete: 'rare' },
  { nom: 'Artiste de Cirque', description: 'Reconnu pour son talent', couleur: '#9C27B0', condition_type: 'niveau', condition_valeur: 15, rarete: 'epique' },
  { nom: 'Virtuose', description: 'Excellence technique', couleur: '#E91E63', condition_type: 'niveau', condition_valeur: 20, rarete: 'epique' },
  { nom: 'Maître Circassien', description: 'Maîtrise exceptionnelle', couleur: '#FF5722', condition_type: 'niveau', condition_valeur: 25, rarete: 'legendaire' },
  { nom: 'Légende du Cirque', description: 'Légende vivante', couleur: '#FFC107', condition_type: 'xp_total', condition_valeur: 50000, rarete: 'legendaire' }
];

/**
 * Défis publics - Matchent le schéma Defi model
 */
const DEFIS_PUBLICS = [
  {
    titre: 'Challenge Débutant',
    description: 'Valider 3 figures de niveau 1-2 en 7 jours',
    type: 'hebdomadaire',
    objectif: 'Valider 3 figures faciles',
    objectif_type: 'figures_validees',
    objectif_valeur: 3,
    xp_recompense: 50,
    date_debut: new Date(),
    date_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    actif: true
  },
  {
    titre: 'Semaine du Jonglage',
    description: 'Valider 5 figures de jonglage en 7 jours',
    type: 'hebdomadaire',
    objectif: 'Pratiquer le jonglage intensivement',
    objectif_type: 'disciplines_pratiquees',
    objectif_valeur: 5,
    xp_recompense: 100,
    date_debut: new Date(),
    date_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    actif: true
  },
  {
    titre: 'Marathon 30 Jours',
    description: 'Se connecter 30 jours consécutifs',
    type: 'evenement',
    objectif: 'Maintenir une pratique régulière',
    objectif_type: 'streak_maintenu',
    objectif_valeur: 30,
    xp_recompense: 500,
    date_debut: new Date(),
    date_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    actif: true
  },
  {
    titre: 'Expert Niveau 5',
    description: 'Valider 3 figures de niveau 5 (difficiles)',
    type: 'evenement',
    objectif: 'Défier les figures les plus difficiles',
    objectif_type: 'figures_validees',
    objectif_valeur: 3,
    xp_recompense: 400,
    date_debut: new Date(),
    date_fin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    actif: true
  },
  {
    titre: 'Quotidien - 3 Étapes',
    description: 'Valider 3 étapes aujourd\'hui',
    type: 'quotidien',
    objectif: 'Pratiquer quotidiennement',
    objectif_type: 'etapes_validees',
    objectif_valeur: 3,
    xp_recompense: 20,
    date_debut: new Date(),
    date_fin: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    actif: true
  }
];

/**
 * Seed du catalogue public
 */
async function seedCataloguePublic() {
  logger.section('Seeding Catalogue Public (Partagé)');

  const catalogueData = {
    disciplines: [],
    disciplineMap: {},
    figures: [],
    figuresByDiscipline: {},
    badges: [],
    titres: [],
    defis: []
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

    // 3. Créer badges publics (ecole_id = NULL)
    logger.info('\n🏅 Création badges publics...');
    for (const badgeData of BADGES_PUBLICS) {
      const badge = await Badge.create({
        ...badgeData,
        ecole_id: null  // Public
      });
      catalogueData.badges.push(badge);
    }
    logger.success(`  ✓ ${BADGES_PUBLICS.length} badges`);

    // 4. Créer titres publics (ecole_id = NULL)
    logger.info('\n👑 Création titres publics...');
    for (const titreData of TITRES_PUBLICS) {
      const titre = await Titre.create({
        ...titreData,
        ecole_id: null  // Public
      });
      catalogueData.titres.push(titre);
    }
    logger.success(`  ✓ ${TITRES_PUBLICS.length} titres`);

    // 5. Créer défis publics (ecole_id = NULL)
    logger.info('\n🎲 Création défis publics...');
    for (const defiData of DEFIS_PUBLICS) {
      const defi = await Defi.create({
        ...defiData,
        ecole_id: null  // Public
      });
      catalogueData.defis.push(defi);
    }
    logger.success(`  ✓ ${DEFIS_PUBLICS.length} défis`);

    logger.section('✅ Catalogue Public créé');
    logger.info(`  - ${catalogueData.disciplines.length} disciplines`);
    logger.info(`  - ${catalogueData.figures.length} figures publiques`);
    logger.info(`  - ${catalogueData.badges.length} badges`);
    logger.info(`  - ${catalogueData.titres.length} titres`);
    logger.info(`  - ${catalogueData.defis.length} défis\n`);

    return catalogueData;

  } catch (error) {
    logger.error(`Erreur lors du seed du catalogue: ${error.message}`);
    throw error;
  }
}

module.exports = seedCataloguePublic;
