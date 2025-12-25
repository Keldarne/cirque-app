const { ProgrammeProf, ProgrammeFigure, AssignationProgramme, Utilisateur, Figure, Discipline } = require('../../models');
const logger = require('../utils/logger');

async function seedProgrammes(profs, figures) {
  logger.section('Création des programmes');

  logger.info(`Received ${profs.length} profs and ${figures.length} figures`);
  logger.info(`Prof emails: ${profs.map(p => p.email).join(', ')}`);

  // Recharger les figures avec leurs disciplines
  const figuresAvecDisciplines = await Figure.findAll({
    include: [{ model: Discipline }]
  });

  const programmes = [];

  // Créer un programme personnel pour chaque utilisateur (profs, élèves, admin, solo)
  logger.info('Création des programmes personnels...');
  const tousUtilisateurs = await Utilisateur.findAll();

  for (const user of tousUtilisateurs) {
    try {
      const progPersonnel = await ProgrammeProf.create({
        professeur_id: user.id,
        nom: `Programme Personnel - ${user.pseudo}`,
        description: 'Mon programme d\'entraînement personnel',
        est_modele: false,
        actif: true
      });
      programmes.push(progPersonnel);
    } catch (error) {
      logger.warn(`Erreur création programme personnel pour ${user.pseudo}: ${error.message}`);
    }
  }
  logger.info(`${tousUtilisateurs.length} programmes personnels créés`);

  // Programme 1: Jonglage Débutant (Prof Jean Martin - École Voltige)
  const profVoltige = profs.find(p => p.email === 'jean.martin@voltige.fr');

  if (!profVoltige) {
    logger.warn('Prof Jean Martin introuvable, skip création programme Jonglage');
  } else {
    logger.info(`Prof Jean Martin trouvé: ${profVoltige.email}`);
    const figuresJonglage = figuresAvecDisciplines.filter(f =>
      f.Discipline && f.Discipline.nom === 'Jonglage'
    ).slice(0, 5);
    logger.info(`Figures jonglage trouvées: ${figuresJonglage.length}`);
    if (figuresJonglage.length > 0) {
      logger.info(`  Disciplines: ${figuresJonglage.map(f => f.Discipline.nom).join(', ')}`);
    } else {
      logger.warn(`  Available disciplines: ${[...new Set(figuresAvecDisciplines.map(f => f.Discipline?.nom).filter(Boolean))].join(', ')}`);
    }

    if (figuresJonglage.length > 0) {
      const progJonglage = await ProgrammeProf.create({
        professeur_id: profVoltige.id,
        nom: 'Jonglage Débutant',
        description: 'Programme d\'initiation au jonglage pour débutants',
        est_modele: true,
        actif: true
      });

      for (let i = 0; i < figuresJonglage.length; i++) {
        await ProgrammeFigure.create({
          programme_id: progJonglage.id,
          figure_id: figuresJonglage[i].id,
          ordre: i + 1
        });
      }

      programmes.push(progJonglage);
      logger.info(`Programme créé: ${progJonglage.nom} (${figuresJonglage.length} figures)`);

      // Assigner à 2 élèves de l'école Voltige
      const elevesVoltige = await Utilisateur.findAll({
        where: { role: 'eleve', ecole_id: profVoltige.ecole_id },
        limit: 2
      });

      for (const eleve of elevesVoltige) {
        await AssignationProgramme.create({
          programme_id: progJonglage.id,
          eleve_id: eleve.id,
          date_assignation: new Date(),
          statut: 'en_cours'
        });
      }

      logger.info(`  → Assigné à ${elevesVoltige.length} élèves`);
    }
  }

  // Programme 2: Aérien Avancé (Prof Marie Lefebvre - Académie)
  const profAcademie = profs.find(p => p.email === 'marie.lefebvre@academie.fr');

  if (!profAcademie) {
    logger.warn('Prof Marie Lefebvre introuvable, skip création programme Aérien');
  } else {
    const figuresAerien = figuresAvecDisciplines.filter(f =>
      f.Discipline && f.Discipline.nom === 'Aérien'
    ).slice(0, 6);

    if (figuresAerien.length > 0) {
      const progAerien = await ProgrammeProf.create({
        professeur_id: profAcademie.id,
        nom: 'Aérien Avancé',
        description: 'Programme pour élèves avancés en disciplines aériennes',
        est_modele: false,
        actif: true
      });

      for (let i = 0; i < figuresAerien.length; i++) {
        await ProgrammeFigure.create({
          programme_id: progAerien.id,
          figure_id: figuresAerien[i].id,
          ordre: i + 1
        });
      }

      programmes.push(progAerien);
      logger.info(`Programme créé: ${progAerien.nom} (${figuresAerien.length} figures)`);

      // Assigner à 3 élèves de l'académie
      const elevesAcademie = await Utilisateur.findAll({
        where: { role: 'eleve', ecole_id: profAcademie.ecole_id },
        limit: 3
      });

      for (const eleve of elevesAcademie) {
        await AssignationProgramme.create({
          programme_id: progAerien.id,
          eleve_id: eleve.id,
          date_assignation: new Date(),
          statut: 'en_cours'
        });
      }

      logger.info(`  → Assigné à ${elevesAcademie.length} élèves`);
    }
  }

  logger.success(`${programmes.length} programmes créés`);

  return programmes;
}

module.exports = seedProgrammes;
