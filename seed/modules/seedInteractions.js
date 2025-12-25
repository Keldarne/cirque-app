/**
 * Seed Interactions Prof-Élève
 *
 * Crée des interactions réalistes entre professeurs et élèves pour tester le système
 * de détection des élèves négligés.
 *
 * Scénarios:
 * - Professeur actif: interactions régulières avec 70% des élèves
 * - Élèves négligés: 30% des élèves sans interaction depuis 30-90 jours
 */

const { InteractionProfEleve, RelationProfEleve } = require('../../models');
const logger = require('../utils/logger');
const { subDays } = require('date-fns');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedInteractions(professors, students) {
  logger.section('Création des interactions prof-élève');

  const interactionTypes = [
    'view_profile',
    'add_comment',
    'validate_step',
    'send_message',
    'update_notes'
  ];

  let totalInteractions = 0;

  for (const prof of professors) {
    // Récupérer les élèves de ce prof
    const relations = await RelationProfEleve.findAll({
      where: {
        professeur_id: prof.id,
        statut: 'accepte'
      }
    });

    const profStudents = students.filter(s =>
      relations.some(r => r.eleve_id === s.id)
    );

    if (profStudents.length === 0) {
      logger.warn(`${prof.prenom} ${prof.nom}: aucun élève assigné`);
      continue;
    }

    // Scénario: 70% élèves actifs, 30% négligés
    const nbElevesActifs = Math.ceil(profStudents.length * 0.7);
    const elevesActifs = profStudents.slice(0, nbElevesActifs);
    const elevesNegliges = profStudents.slice(nbElevesActifs);

    // Élèves actifs: interactions régulières (0-29 jours)
    for (const eleve of elevesActifs) {
      const nbInteractions = randomInt(5, 20);

      for (let i = 0; i < nbInteractions; i++) {
        const joursSansInteraction = randomInt(0, 29);
        const typeInteraction = randomElement(interactionTypes);

        await InteractionProfEleve.create({
          professeur_id: prof.id,
          eleve_id: eleve.id,
          type_interaction: typeInteraction,
          date_interaction: subDays(new Date(), joursSansInteraction),
          contexte: {
            via: 'seed',
            scenario: 'actif'
          }
        });

        totalInteractions++;
      }
    }

    // Élèves négligés: dernière interaction >30 jours (warning ou critical)
    for (const eleve of elevesNegliges) {
      const isNiveauCritique = Math.random() > 0.5; // 50% warning, 50% critique
      const joursSansInteraction = isNiveauCritique
        ? randomInt(60, 90)  // Critical: 60-90 jours
        : randomInt(30, 59); // Warning: 30-59 jours

      // Créer 1-3 anciennes interactions
      const nbOldInteractions = randomInt(1, 3);

      for (let i = 0; i < nbOldInteractions; i++) {
        const typeInteraction = randomElement(interactionTypes);
        const joursDelta = joursSansInteraction + randomInt(0, 30);

        await InteractionProfEleve.create({
          professeur_id: prof.id,
          eleve_id: eleve.id,
          type_interaction: typeInteraction,
          date_interaction: subDays(new Date(), joursDelta),
          contexte: {
            via: 'seed',
            scenario: isNiveauCritique ? 'neglige_critique' : 'neglige_warning'
          }
        });

        totalInteractions++;
      }
    }

    logger.success(
      `✓ ${prof.prenom} ${prof.nom}: ${elevesActifs.length} actifs, ${elevesNegliges.length} négligés`
    );
  }

  logger.success(`✓ Total: ${totalInteractions} interactions créées`);

  return { totalInteractions };
}

module.exports = seedInteractions;
