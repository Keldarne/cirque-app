const { Utilisateur } = require('../../models');
const logger = require('../utils/logger');

async function seedUsers(userData) {
  logger.section('Création des utilisateurs');

  const professors = [];
  const students = [];

  for (const userDef of userData) {
    // Générer un pseudo à partir du prénom et nom
    const pseudo = `${userDef.prenom.toLowerCase()}.${userDef.nom.toLowerCase()}`;

    try {
      const user = await Utilisateur.create({
        pseudo,
        email: userDef.email,
        mot_de_passe: 'password123', // Mot de passe par défaut pour tous les comptes de test
        nom: userDef.nom,
        prenom: userDef.prenom,
        role: userDef.role,
        niveau: userDef.niveau,
        xp_total: userDef.xp_total
      });

      if (userDef.role === 'professeur') {
        professors.push({ ...user.toJSON(), scenario: null });
      } else {
        students.push({ ...user.toJSON(), scenario: userDef.scenario });
      }

      logger.info(`Créé: ${userDef.prenom} ${userDef.nom} (${userDef.role}${userDef.scenario ? ` - ${userDef.scenario}` : ''})`);
    } catch (error) {
      logger.error(`Erreur création ${userDef.email}: ${error.message}`);
      throw error;
    }
  }

  logger.success(`${professors.length + students.length} utilisateurs créés`);
  logger.info(`  - ${professors.length} professeurs`);
  logger.info(`  - ${students.length} élèves`);

  return { professors, students };
}

module.exports = seedUsers;
