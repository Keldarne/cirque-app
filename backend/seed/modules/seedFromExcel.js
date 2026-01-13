const xlsx = require('xlsx');
const path = require('path');
const { Figure, Discipline } = require('../../src/models');
const logger = require('../utils/logger');

/**
 * Liste des noms de colonnes possibles pour les champs de base
 */
const COLUMN_ALIASES = {
  nom: [
    'Titre de la Figure', 
    'Nom de la figure', 
    'Titre de la Figure (Nom Français / Anglais)', 
    'Nom de la Figure (Français)', 
    'Figures', 
    'Exercice (Nom Français)' // Ajout pour Condition Physique
  ],
  descriptif: [
    'Description Détaillée', 
    'Description de base', 
    'Description', 
    'Type de Mouvement / Ciblage' // Fallback description pour Condition Physique
  ],
  difficulty: ['Niveau de Difficulté', 'Niveau de difficulté (1-5)', 'Niveau'],
  video: ['Source (URL)', 'Lien vidéo [URL]', 'Video', 'Lien Vidéo']
};

/**
 * Mappe les noms de colonnes Excel vers les clés de métadonnées selon la discipline
 */
const METADATA_MAPPING_RULES = {
  'Jonglage': {
    "Nombre d'Objets": 'nb_objets',
    'Catégorie': 'categorie'
  },
  'Diabolo': {
    'Nombre de diabolos': 'nb_objets',
    'Catégorie': 'categorie'
  },
  'Acrobatie': {
    'Catégorie': 'sub_type'
  },
  'Condition physique': {
    'Catégorie Principale': 'categorie',
    'Type de Mouvement / Ciblage': 'ciblage',
    'Niveau de Popularité': 'popularite'
  }
};

/**
 * Importe les figures depuis le fichier Excel
 */
async function seedFromExcel() {
  logger.info('📦 Import des figures depuis Excel (V2 - Colonnes Fr)...');

  const filePath = path.join(process.cwd(), 'docs', 'First 100 skills per disciplines.xlsx');
  
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    logger.info(`   📂 ${sheetNames.length} feuilles trouvées.`);

    const stats = {
      disciplines: 0,
      figures: 0,
      errors: 0
    };

    const disciplinesMap = {};

    for (const sheetName of sheetNames) {
      // Pour Acrobatie, on voit que la première ligne contient les headers réels
      // On va essayer de détecter si on doit sauter une ligne ou utiliser un mapping spécifique
      let data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      
      if (data.length === 0) continue;

      // Correction pour Acrobatie si headers mal détectés
      if (data[0]['__EMPTY'] === 'Titre de la Figure') {
        const headers = data[0];
        data = data.slice(1).map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            if (headers[key]) newRow[headers[key]] = row[key];
          });
          return newRow;
        });
      }

      // 1. Créer ou récupérer la discipline
      const disciplineNom = sheetName; 
      let discipline = disciplinesMap[disciplineNom];
      if (!discipline) {
        [discipline] = await Discipline.findOrCreate({
          where: { nom: disciplineNom },
          defaults: {
            description: `Catalogue importé : ${disciplineNom}`
          }
        });
        disciplinesMap[disciplineNom] = discipline;
        stats.disciplines++;
      }

      logger.info(`   👉 Traitement de ${disciplineNom} (${data.length} lignes)`);

      // 2. Parcourir les figures
      for (const row of data) {
        try {
          // Trouver le nom
          let nom = null;
          for (const alias of COLUMN_ALIASES.nom) {
            if (row[alias]) {
              nom = row[alias];
              break;
            }
          }

          // Ignorer les lignes de titres de section (ex: **I. Suspensions**)
          // Mais conserver les noms en gras comme "**Squat**" qui sont des vraies figures
          if (!nom) continue;
          
          let nomStr = String(nom).trim();
          
          // Si c'est un titre de section (commence par **I. ou **II.), on ignore
          if (nomStr.match(/^\*\*([IVX]+)\./)) continue;

          // Nettoyage spécifique Condition Physique (et autres)
          // 1. Enlever la numérotation "1.", "2."
          nomStr = nomStr.replace(/^\d+\.\s*/, '');
          // 2. Enlever les astérisques markdown
          nomStr = nomStr.replace(/\*\*/g, '');
          
          nom = nomStr;

          // Trouver description, difficulté, video
          let descriptif = `Figure de ${disciplineNom}`;
          for (const alias of COLUMN_ALIASES.descriptif) {
            if (row[alias]) {
              descriptif = row[alias];
              break;
            }
          }

          let difficulty = 1;
          for (const alias of COLUMN_ALIASES.difficulty) {
            if (row[alias]) {
              difficulty = parseInt(row[alias]) || 1;
              break;
            }
          }

          let video_url = null;
          for (const alias of COLUMN_ALIASES.video) {
            if (row[alias]) {
              video_url = row[alias];
              break;
            }
          }

          // --- MAPPING DYNAMIQUE DES MÉTADONNÉES ---
          const metadata = {};
          
          // Définir les colonnes à ignorer car déjà traitées dans les champs de base
          const coreColumns = [
            ...COLUMN_ALIASES.nom,
            ...COLUMN_ALIASES.descriptif,
            ...COLUMN_ALIASES.difficulty,
            ...COLUMN_ALIASES.video,
            '__EMPTY', 'N°', 'N' // Colonnes techniques ou vides
          ];

          // Dictionnaire de traduction des headers Fr -> Key technique
          const headerTranslation = {
            "Nombre d'Objets": 'nb_objets',
            "Nombre de diabolos": 'nb_objets',
            "Apparatus": 'agres',
            "Agrès": 'agres',
            "Matériel": 'type_objets',
            "Catégorie": 'categorie'
          };

          Object.keys(row).forEach(key => {
            if (!coreColumns.includes(key)) {
              const techKey = headerTranslation[key] || key.toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[°'()]/g, '')
                .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
              
              metadata[techKey] = row[key];
            }
          });

          // --- DÉTECTION INTELLIGENTE SITESWAP (JONGLAGE) ---
          const isJugglingDiscipline = ['Jonglage', 'Massues', 'Diabolo'].includes(disciplineNom);
          if (isJugglingDiscipline && !metadata.siteswap) {
            const figureNom = String(nom).trim();
            
            // Cas 1: Le nom est directement un chiffre (ex: 441, 531)
            if (/^\d+$/.test(figureNom)) {
              metadata.siteswap = figureNom;
            } 
            // Cas 2: Le nom contient (X Balles) ou (X Clubs)
            else {
              const match = figureNom.match(/\((\d+)\s+(Balles|Massues|Diabolos|Clubs|Objects)\)/i);
              if (match && match[1]) {
                metadata.siteswap = match[1];
              }
              // Cas 3: Cascade simple sans parenthèses ? On peut laisser tel quel ou tenter d'autres regex
            }
          }

          // Nettoyage siteswap si présent
          if (metadata.siteswap) {
            metadata.siteswap = String(metadata.siteswap);
          }

          // Nettoyage de l'URL vidéo (éviter les placeholders [URL])
          if (video_url) {
            const trimmedUrl = String(video_url).trim();
            // Doit commencer par http ou https et ne pas être un placeholder
            if (!trimmedUrl.match(/^https?:\/\//) || trimmedUrl.includes('[URL]')) {
              video_url = null;
            } else {
              video_url = trimmedUrl;
            }
          }

          // Création de la figure
          await Figure.create({
            nom: String(nom).trim(),
            descriptif: String(descriptif).trim(),
            discipline_id: discipline.id,
            difficulty_level: Math.min(Math.max(difficulty, 1), 10),
            video_url: video_url,
            image_url: null,
            type: (disciplineNom === 'Condition physique') ? 'renforcement' : 'artistique',
            visibilite: 'public',
            ecole_id: null,
            metadata: Object.keys(metadata).length > 0 ? metadata : null
          });

          stats.figures++;
        } catch (err) {
          // logger.warn(`      ⚠️ Erreur ligne: ${err.message}`);
          stats.errors++;
        }
      }
    }

    logger.info(`✅ Import Excel terminé : ${stats.figures} figures créées.`);
    
    return {
        disciplines: Object.values(disciplinesMap),
        figuresCount: stats.figures
    };

  } catch (error) {
    logger.error(`❌ Erreur fatale lors de l'import Excel: ${error.message}`);
    return { disciplines: [], figuresCount: 0 };
  }
}

module.exports = seedFromExcel;