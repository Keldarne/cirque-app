const Ecole = require('./Ecole');
const Utilisateur = require('./Utilisateur');
const Figure = require('./Figure');
const Discipline = require('./Discipline');
const EtapeProgression = require('./EtapeProgression');
const ProgressionEtape = require('./ProgressionEtape'); // Refactored
const RelationProfEleve = require('./RelationProfEleve');
const Badge = require('./Badge');
const BadgeUtilisateur = require('./BadgeUtilisateur');
const Defi = require('./Defi');
const DefiUtilisateur = require('./DefiUtilisateur');
const Streak = require('./Streak');
const Titre = require('./Titre');
const TitreUtilisateur = require('./TitreUtilisateur');
const Groupe = require('./Groupe');
const GroupeEleve = require('./GroupeEleve');
const InteractionProfEleve = require('./InteractionProfEleve');
const TentativeEtape = require('./TentativeEtape'); // Refactored
const ProgrammeProf = require('./ProgrammeProf');
const ProgrammeFigure = require('./ProgrammeFigure');
const AssignationProgramme = require('./AssignationProgramme');
const AssignationGroupeProgramme = require('./AssignationGroupeProgramme');
const ProgrammePartage = require('./ProgrammePartage');
const ExerciceFigure = require('./ExerciceFigure');
const SuggestionFigure = require('./SuggestionFigure');
const DisciplineAvailability = require('./DisciplineAvailability');
const SystemLog = require('./SystemLog');
const SystemBackup = require('./SystemBackup');
const InteractionSummary = require('./InteractionSummary');

// ═══════════════════════════════════════════════════════════════════
// Relations
// ═══════════════════════════════════════════════════════════════════

// Multi-tenant
Ecole.hasMany(Utilisateur, { foreignKey: 'ecole_id', as: 'utilisateurs' });
Utilisateur.belongsTo(Ecole, { foreignKey: 'ecole_id', as: 'Ecole' });
// ... (autres relations Ecole)

// Discipline & Figure
Discipline.hasMany(Figure, { foreignKey: 'discipline_id' });
Figure.belongsTo(Discipline, { foreignKey: 'discipline_id' });
Utilisateur.hasMany(Figure, { foreignKey: 'createur_id', as: 'figuresCreees' });
Figure.belongsTo(Utilisateur, { foreignKey: 'createur_id', as: 'createur' });

// Discipline Availability (Per-School Configuration)
Ecole.hasMany(DisciplineAvailability, { foreignKey: 'ecole_id', as: 'disciplinesDisponibles' });
DisciplineAvailability.belongsTo(Ecole, { foreignKey: 'ecole_id', as: 'ecole' });
Discipline.hasMany(DisciplineAvailability, { foreignKey: 'discipline_id', as: 'disponibilitesEcoles' });
DisciplineAvailability.belongsTo(Discipline, { foreignKey: 'discipline_id', as: 'discipline' });

// ──────────────────────────────────────────────────────────────────
// EXERCICES DÉCOMPOSÉS (Relations Récursives)
// ──────────────────────────────────────────────────────────────────

// Relation récursive: Figure a plusieurs exercices (qui sont des Figures)
Figure.belongsToMany(Figure, {
  through: ExerciceFigure,
  as: 'exercices',
  foreignKey: 'figure_id',
  otherKey: 'exercice_figure_id'
});

// Relation inverse: Figure est exercice de plusieurs Figures parentes
Figure.belongsToMany(Figure, {
  through: ExerciceFigure,
  as: 'figuresParentes',
  foreignKey: 'exercice_figure_id',
  otherKey: 'figure_id'
});

// Associations directes pour inclusions avec alias
ExerciceFigure.belongsTo(Figure, { as: 'figure', foreignKey: 'figure_id' });
ExerciceFigure.belongsTo(Figure, { as: 'exerciceFigure', foreignKey: 'exercice_figure_id' });

// Relation 1:N pour accéder à la table de junction directement (fix conflit alias)
Figure.hasMany(ExerciceFigure, { foreignKey: 'figure_id', as: 'relationsExercices' });

// ──────────────────────────────────────────────────────────────────
// STRUCTURE DE PROGRESSION (REFACTORISÉE)
// ──────────────────────────────────────────────────────────────────

// Figure -> EtapeProgression (Une figure a plusieurs étapes définies. Inchangé)
Figure.hasMany(EtapeProgression, { foreignKey: 'figure_id', as: 'etapes' });
EtapeProgression.belongsTo(Figure, { foreignKey: 'figure_id' });

// ProgressionEtape (La nouvelle source de vérité)
// Un utilisateur a une progression sur plusieurs étapes
Utilisateur.hasMany(ProgressionEtape, { foreignKey: 'utilisateur_id', as: 'progressions' });
ProgressionEtape.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id' });

// Une étape peut avoir plusieurs progressions d'utilisateurs
EtapeProgression.hasMany(ProgressionEtape, { foreignKey: 'etape_id' });
ProgressionEtape.belongsTo(EtapeProgression, { foreignKey: 'etape_id', as: 'etape' });

// Un professeur peut valider une étape
ProgressionEtape.belongsTo(Utilisateur, { as: 'validateurProf', foreignKey: 'valide_par_prof_id' });

// TentativeEtape (Maintenant lié à ProgressionEtape)
ProgressionEtape.hasMany(TentativeEtape, { foreignKey: 'progression_etape_id', as: 'tentatives' });
TentativeEtape.belongsTo(ProgressionEtape, { foreignKey: 'progression_etape_id' });


// ──────────────────────────────────────────────────────────────────
// Système Prof-Élève, Programmes, Gamification (inchangé)
// ──────────────────────────────────────────────────────────────────

// RelationProfEleve
Utilisateur.hasMany(RelationProfEleve, { foreignKey: 'professeur_id', as: 'elevesGeres' });
Utilisateur.hasMany(RelationProfEleve, { foreignKey: 'eleve_id', as: 'professeurs' });
RelationProfEleve.belongsTo(Utilisateur, { foreignKey: 'professeur_id', as: 'professeur' });
RelationProfEleve.belongsTo(Utilisateur, { foreignKey: 'eleve_id', as: 'eleve' });

// Groupe & GroupeEleve
Utilisateur.hasMany(Groupe, { foreignKey: 'professeur_id', as: 'groupes' });
Groupe.belongsTo(Utilisateur, { foreignKey: 'professeur_id', as: 'professeur' });
Groupe.hasMany(GroupeEleve, { foreignKey: 'groupe_id', as: 'membres' });
GroupeEleve.belongsTo(Groupe, { foreignKey: 'groupe_id' });
Utilisateur.hasMany(GroupeEleve, { foreignKey: 'eleve_id' });
GroupeEleve.belongsTo(Utilisateur, { foreignKey: 'eleve_id', as: 'eleve' });

// Programmes
Utilisateur.hasMany(ProgrammeProf, { foreignKey: 'professeur_id', as: 'programmes' });
ProgrammeProf.belongsTo(Utilisateur, { foreignKey: 'professeur_id', as: 'Professeur' });
ProgrammeProf.hasMany(ProgrammeFigure, { foreignKey: 'programme_id', as: 'ProgrammesFigures' });
ProgrammeFigure.belongsTo(ProgrammeProf, { foreignKey: 'programme_id', as: 'Programme' });
Figure.hasMany(ProgrammeFigure, { foreignKey: 'figure_id' });
ProgrammeFigure.belongsTo(Figure, { foreignKey: 'figure_id', as: 'Figure' });
ProgrammeProf.hasMany(AssignationProgramme, { foreignKey: 'programme_id', as: 'Assignations' });
AssignationProgramme.belongsTo(ProgrammeProf, { foreignKey: 'programme_id', as: 'Programme' });
Utilisateur.hasMany(AssignationProgramme, { foreignKey: 'eleve_id', as: 'programmesAssignes' });
AssignationProgramme.belongsTo(Utilisateur, { foreignKey: 'eleve_id', as: 'Eleve' });
Groupe.hasMany(AssignationProgramme, { foreignKey: 'source_groupe_id', as: 'assignationsParGroupe' });
AssignationProgramme.belongsTo(Groupe, { foreignKey: 'source_groupe_id', as: 'GroupeSource' });

// Assignations Groupe-Programme
ProgrammeProf.hasMany(AssignationGroupeProgramme, { foreignKey: 'programme_id', as: 'AssignationsGroupes' });
AssignationGroupeProgramme.belongsTo(ProgrammeProf, { foreignKey: 'programme_id', as: 'Programme' });
Groupe.hasMany(AssignationGroupeProgramme, { foreignKey: 'groupe_id', as: 'programmesAssignes' });
AssignationGroupeProgramme.belongsTo(Groupe, { foreignKey: 'groupe_id', as: 'Groupe' });

// Partages de Programmes (Polymorphique: prof/peer, avec cycle de vie)
ProgrammeProf.hasMany(ProgrammePartage, { foreignKey: 'programme_id', as: 'Partages' });
ProgrammePartage.belongsTo(ProgrammeProf, { foreignKey: 'programme_id', as: 'Programme' });

// Relations polymorphiques (qui partage / qui reçoit)
Utilisateur.hasMany(ProgrammePartage, { foreignKey: 'shared_by_id', as: 'partagesEnvoyes' });
ProgrammePartage.belongsTo(Utilisateur, { foreignKey: 'shared_by_id', as: 'SharedBy' });

Utilisateur.hasMany(ProgrammePartage, { foreignKey: 'shared_with_id', as: 'partagesRecus' });
ProgrammePartage.belongsTo(Utilisateur, { foreignKey: 'shared_with_id', as: 'SharedWith' });

// Qui a annulé le partage
Utilisateur.hasMany(ProgrammePartage, { foreignKey: 'annule_par', as: 'partagesAnnules' });
ProgrammePartage.belongsTo(Utilisateur, { foreignKey: 'annule_par', as: 'AnnulePar' });

// Lien AssignationProgramme → ProgrammePartage (source optionnelle)
AssignationProgramme.belongsTo(ProgrammePartage, { foreignKey: 'source_partage_id', as: 'PartageSource' });
ProgrammePartage.hasMany(AssignationProgramme, { foreignKey: 'source_partage_id', as: 'AssignationsDependantes' });

// Gamification
Badge.hasMany(BadgeUtilisateur, { foreignKey: 'badge_id' });
BadgeUtilisateur.belongsTo(Badge, { foreignKey: 'badge_id' });
Utilisateur.hasMany(BadgeUtilisateur, { foreignKey: 'utilisateur_id', as: 'badgesObtenus' });
BadgeUtilisateur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id' });
Titre.hasMany(TitreUtilisateur, { foreignKey: 'titre_id' });
TitreUtilisateur.belongsTo(Titre, { foreignKey: 'titre_id' });
Utilisateur.hasMany(TitreUtilisateur, { foreignKey: 'utilisateur_id', as: 'titresObtenus' });
TitreUtilisateur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id' });
Defi.hasMany(DefiUtilisateur, { foreignKey: 'defi_id' });
DefiUtilisateur.belongsTo(Defi, { foreignKey: 'defi_id' });
Utilisateur.hasMany(DefiUtilisateur, { foreignKey: 'utilisateur_id', as: 'defisUtilisateur' });
DefiUtilisateur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id' });
Utilisateur.hasOne(Streak, { foreignKey: 'utilisateur_id', as: 'streak' });
Streak.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id' });

// ──────────────────────────────────────────────────────────────────
// SUGGESTIONS (Cache de recommandations)
// ──────────────────────────────────────────────────────────────────

// Suggestions pour les utilisateurs
SuggestionFigure.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
Utilisateur.hasMany(SuggestionFigure, { foreignKey: 'utilisateur_id', as: 'suggestions' });

// Suggestions pour les groupes
SuggestionFigure.belongsTo(Groupe, { foreignKey: 'groupe_id', as: 'groupe' });
Groupe.hasMany(SuggestionFigure, { foreignKey: 'groupe_id', as: 'suggestions' });

// Figures suggérées
SuggestionFigure.belongsTo(Figure, { foreignKey: 'figure_id', as: 'figure' });
Figure.hasMany(SuggestionFigure, { foreignKey: 'figure_id', as: 'suggestionsPour' });

// ──────────────────────────────────────────────────────────────────
// ADMINISTRATION SYSTÈME
// ──────────────────────────────────────────────────────────────────

// SystemBackup peut être créé par un utilisateur (null si automatique)
SystemBackup.belongsTo(Utilisateur, { foreignKey: 'created_by', as: 'creator' });
Utilisateur.hasMany(SystemBackup, { foreignKey: 'created_by', as: 'backups' });

// SystemLog n'a pas de relation directe (metadata JSON contient utilisateur_id si besoin)

// InteractionSummary - Résumé mensuel des interactions prof-élève
InteractionSummary.belongsTo(Utilisateur, { foreignKey: 'professeur_id', as: 'professeur' });
InteractionSummary.belongsTo(Utilisateur, { foreignKey: 'eleve_id', as: 'eleve' });
Utilisateur.hasMany(InteractionSummary, { foreignKey: 'professeur_id', as: 'interactionsSummaryProfesseur' });
Utilisateur.hasMany(InteractionSummary, { foreignKey: 'eleve_id', as: 'interactionsSummaryEleve' });

// ... (autres relations inchangées)

module.exports = {
  Ecole,
  Utilisateur,
  Figure,
  Discipline,
  EtapeProgression,
  ProgressionEtape, // Refactored
  RelationProfEleve,
  Badge,
  BadgeUtilisateur,
  Defi,
  DefiUtilisateur,
  Streak,
  Titre,
  TitreUtilisateur,
  Groupe,
  GroupeEleve,
  InteractionProfEleve,
  TentativeEtape, // Refactored
  ProgrammeProf,
  ProgrammeFigure,
  AssignationProgramme,
  AssignationGroupeProgramme,
  ProgrammePartage,
  ExerciceFigure,
  SuggestionFigure,
  DisciplineAvailability,
  SystemLog,
  SystemBackup,
  InteractionSummary
};