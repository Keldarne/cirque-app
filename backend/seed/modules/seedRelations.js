const { RelationProfEleve, Groupe, GroupeEleve, Utilisateur } = require('../../src/models');
const logger = require('../utils/logger');

/**
 * NOUVEAU SYSTÈME BASÉ SUR L'ÉCOLE (Migration 15 Déc 2025)
 *
 * Les professeurs avec ecole_id voient automatiquement TOUS les élèves de leur école.
 * Les relations sont créées automatiquement pour tous les élèves de la même école.
 * Plus besoin de codes d'invitation - accès basé sur ecole_id matching.
 */
async function seedRelations(professors, students) {
  logger.section('Création des relations prof-élève (système école-based)');

  const relations = [];
  const groupes = [];

  // Créer relations basées sur l'école
  for (const prof of professors) {
    if (!prof.ecole_id) {
      logger.info(`${prof.prenom} ${prof.nom}: Pas d'école (prof solo) - skip relations auto`);
      continue;
    }

    // Trouver TOUS les élèves de la même école
    const elevesEcole = students.filter(s => s.ecole_id === prof.ecole_id);

    logger.info(`${prof.prenom} ${prof.nom}: ${elevesEcole.length} élèves dans l'école`);

    // Créer relations avec TOUS les élèves de l'école
    for (const student of elevesEcole) {
      try {
        const relation = await RelationProfEleve.create({
          professeur_id: prof.id,
          eleve_id: student.id,
          statut: 'accepte',
          date_acceptation: new Date(),
          code_invitation: null // Plus utilisé dans le nouveau système
        });

        relations.push(relation);
      } catch (error) {
        // Si relation existe déjà (UNIQUE constraint), continuer
        if (error.name === 'SequelizeUniqueConstraintError') {
          logger.warning(`  Relation déjà existante: ${prof.prenom}-${student.prenom}`);
        } else {
          logger.error(`Erreur création relation ${prof.prenom}-${student.prenom}: ${error.message}`);
          throw error;
        }
      }
    }

    // Créer un groupe pour ce professeur avec quelques élèves
    const groupe = await Groupe.create({
      professeur_id: prof.id,
      nom: `Classe de ${prof.prenom} ${prof.nom}`,
      description: `Groupe principal du professeur ${prof.prenom}`,
      couleur: ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2'][Math.floor(Math.random() * 5)]
    });

    groupes.push(groupe);
    logger.info(`  Groupe créé: "${groupe.nom}"`);

    // Ajouter quelques élèves au groupe (50-80% des élèves de l'école)
    const nbElevesGroupe = Math.max(1, Math.floor(elevesEcole.length * (0.5 + Math.random() * 0.3)));
    const elevesGroupe = elevesEcole.slice(0, nbElevesGroupe);

    for (const student of elevesGroupe) {
      await GroupeEleve.create({
        groupe_id: groupe.id,
        eleve_id: student.id
      });
      logger.info(`    → ${student.prenom} ${student.nom} ajouté au groupe`);
    }

    logger.info(`  ${elevesGroupe.length}/${elevesEcole.length} élèves ajoutés au groupe`);
  }

  logger.success(`${relations.length} relations prof-élève créées (école-based)`);
  logger.success(`${groupes.length} groupes créés`);

  return { relations, groupes };
}

module.exports = seedRelations;
