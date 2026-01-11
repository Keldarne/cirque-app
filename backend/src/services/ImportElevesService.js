/**
 * Service d'import d'élèves en masse
 * Gère le parsing CSV, la génération de credentials, et la création en masse
 */

const fs = require('fs');
const csv = require('csv-parser');
const { Utilisateur, Ecole } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../../db');

class ImportElevesService {
  /**
   * Génère le préfixe de 3 lettres à partir du nom d'école
   * @param {string} nomEcole - Nom complet de l'école
   * @returns {string} Préfixe de 3 lettres en minuscules
   *
   * Exemples:
   * "École de Cirque Voltige" → "vol"
   * "Académie des Arts du Cirque" → "aca"
   * "Cirque du Soleil" → "cir"
   */
  static genererPrefixeEcole(nomEcole) {
    // Mots à ignorer
    const motsIgnores = ['école', 'academie', 'académie', 'de', 'des', 'du', 'la', 'le', 'les'];

    // Nettoyer et séparer en mots
    const mots = nomEcole
      .toLowerCase()
      .split(/\s+/)
      .filter(mot => mot.length > 0 && !motsIgnores.includes(mot));

    // Prendre le premier mot significatif
    const motSignificatif = mots[0] || 'eco';

    // Extraire les 3 premières lettres
    return motSignificatif.substring(0, 3).toLowerCase();
  }

  /**
   * Extrait le domaine du nom d'école pour les emails
   * @param {string} nomEcole - Nom complet de l'école
   * @returns {string} Domaine pour les emails
   *
   * Exemples:
   * "École de Cirque Voltige" → "voltige"
   * "Académie des Arts du Cirque" → "academie"
   */
  static extraireDomaine(nomEcole) {
    const motsIgnores = ['école', 'academie', 'académie', 'de', 'des', 'du', 'la', 'le', 'les', 'arts', 'cirque'];

    const mots = nomEcole
      .toLowerCase()
      .split(/\s+/)
      .filter(mot => mot.length > 2 && !motsIgnores.includes(mot));

    const domaine = mots[0] || 'ecole';

    // Normaliser les accents
    return domaine
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Normalise une chaîne pour pseudo/email (enlève accents, caractères spéciaux)
   * @param {string} str - Chaîne à normaliser
   * @returns {string} Chaîne normalisée
   */
  static normaliserChaine(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9.-]/g, ''); // Garder seulement lettres, chiffres, point, tiret
  }

  /**
   * Génère un pseudo unique: {prefix}-prenom.nom
   * @param {string} prenom - Prénom de l'élève
   * @param {string} nom - Nom de l'élève
   * @param {string} prefixeEcole - Préfixe de 3 lettres de l'école
   * @returns {string} Pseudo généré
   *
   * Exemple: genererPseudo("Lucas", "Moreau", "vol") → "vol-lucas.moreau"
   */
  static genererPseudo(prenom, nom, prefixeEcole) {
    const prenomNorm = this.normaliserChaine(prenom);
    const nomNorm = this.normaliserChaine(nom);
    return `${prefixeEcole}-${prenomNorm}.${nomNorm}`;
  }

  /**
   * Génère un email: prenom.nom@{domaine}.fr
   * @param {string} prenom - Prénom de l'élève
   * @param {string} nom - Nom de l'élève
   * @param {string} domaineEcole - Domaine de l'école
   * @returns {string} Email généré
   *
   * Exemple: genererEmail("Lucas", "Moreau", "voltige") → "lucas.moreau@voltige.fr"
   */
  static genererEmail(prenom, nom, domaineEcole) {
    const prenomNorm = this.normaliserChaine(prenom);
    const nomNorm = this.normaliserChaine(nom);
    return `${prenomNorm}.${nomNorm}@${domaineEcole}.fr`;
  }

  /**
   * Génère mot de passe par école: {NomÉcole}{Année}!
   * @param {string} nomEcole - Nom complet de l'école
   * @returns {string} Mot de passe généré
   *
   * Exemple: genererMotDePasseEcole("École Voltige") → "Voltige2026!"
   */
  static genererMotDePasseEcole(nomEcole) {
    const motsIgnores = ['école', 'academie', 'académie', 'de', 'des', 'du', 'la', 'le', 'les', 'arts', 'cirque'];

    const mots = nomEcole
      .split(/\s+/)
      .filter(mot => mot.length > 2 && !motsIgnores.includes(mot.toLowerCase()));

    // Capitaliser le premier mot significatif
    const motPrincipal = mots[0] || 'Ecole';
    const motCapitalise = motPrincipal.charAt(0).toUpperCase() + motPrincipal.slice(1).toLowerCase();

    const annee = new Date().getFullYear();

    return `${motCapitalise}${annee}!`;
  }

  /**
   * Parse le fichier CSV et retourne array d'objets
   * @param {string} filePath - Chemin du fichier CSV
   * @returns {Promise<Array>} Array d'objets {prenom, nom, email?}
   */
  static async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      fs.createReadStream(filePath)
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Enlever accents des headers
        }))
        .on('data', (data) => {
          // Accepter "prenom" ou "prénom" (normalisé)
          const prenom = data.prenom || data.prénom;
          const nom = data.nom;
          const email = data.email || null;

          if (!prenom || !nom) {
            errors.push({
              row: results.length + 1,
              data,
              error: 'Colonnes Prénom et Nom requises'
            });
            return;
          }

          results.push({
            prenom: prenom.trim(),
            nom: nom.trim(),
            email: email ? email.trim() : null
          });
        })
        .on('end', () => {
          if (errors.length > 0) {
            reject({
              status: 400,
              message: 'Erreurs dans le fichier CSV',
              errors
            });
          } else if (results.length === 0) {
            reject({
              status: 400,
              message: 'Fichier CSV vide ou format invalide'
            });
          } else {
            resolve(results);
          }
        })
        .on('error', (error) => {
          reject({
            status: 400,
            message: 'Erreur de parsing CSV: ' + error.message
          });
        });
    });
  }

  /**
   * Valide les données d'un élève
   * @param {Object} eleve - Données de l'élève
   * @param {number} index - Index dans le CSV (pour rapport d'erreur)
   * @returns {Object|null} Erreur si invalide, null si valide
   */
  static validerDonneesEleve(eleve, index) {
    // Validation prénom
    if (!eleve.prenom || eleve.prenom.length < 2) {
      return {
        row: index + 1,
        prenom: eleve.prenom,
        nom: eleve.nom,
        error: 'Prénom doit contenir au moins 2 caractères'
      };
    }

    // Validation nom
    if (!eleve.nom || eleve.nom.length < 2) {
      return {
        row: index + 1,
        prenom: eleve.prenom,
        nom: eleve.nom,
        error: 'Nom doit contenir au moins 2 caractères'
      };
    }

    // Validation email si fourni
    if (eleve.email && !eleve.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return {
        row: index + 1,
        prenom: eleve.prenom,
        nom: eleve.nom,
        error: 'Format email invalide'
      };
    }

    return null;
  }

  /**
   * Vérifie si pseudo/email existe déjà
   * @param {Array} eleves - Array d'élèves avec pseudo et email générés
   * @returns {Promise<void>} Rejette si doublons trouvés
   */
  static async verifierDoublons(eleves) {
    const pseudos = eleves.map(e => e.pseudo);
    const emails = eleves.map(e => e.email);

    // Vérifier doublons dans le fichier CSV lui-même
    const pseudosUniques = new Set(pseudos);
    if (pseudosUniques.size !== pseudos.length) {
      const doublonsPseudos = pseudos.filter((item, index) => pseudos.indexOf(item) !== index);
      throw {
        status: 400,
        message: `Doublons détectés dans le CSV: ${[...new Set(doublonsPseudos)].join(', ')}`
      };
    }

    // Vérifier dans la base de données
    const existing = await Utilisateur.findAll({
      where: {
        [Op.or]: [
          { pseudo: { [Op.in]: pseudos } },
          { email: { [Op.in]: emails } }
        ]
      },
      attributes: ['pseudo', 'email']
    });

    if (existing.length > 0) {
      const conflicts = existing.map(u => u.pseudo || u.email).join(', ');
      throw {
        status: 409,
        message: `Utilisateurs déjà existants: ${conflicts}`
      };
    }
  }

  /**
   * Vérifie que l'import ne dépasse pas la limite
   * @param {number} ecoleId - ID de l'école
   * @param {number} nombreEleves - Nombre d'élèves à importer
   * @returns {Promise<void>} Rejette si limite dépassée
   */
  static async verifierLimiteEcole(ecoleId, nombreEleves) {
    const ecole = await Ecole.findByPk(ecoleId);

    if (!ecole) {
      throw {
        status: 404,
        message: 'École non trouvée'
      };
    }

    // Compter les élèves actuels
    const countActuel = await Utilisateur.count({
      where: {
        ecole_id: ecoleId,
        role: 'eleve'
      }
    });

    const nouveauTotal = countActuel + nombreEleves;

    if (nouveauTotal > ecole.max_eleves) {
      throw {
        status: 403,
        message: `Import dépasserait la limite d'élèves (${countActuel} + ${nombreEleves} > ${ecole.max_eleves})`
      };
    }
  }

  /**
   * Importe les élèves en transaction
   * @param {Array} eleves - Array d'élèves avec toutes les données
   * @param {number} ecoleId - ID de l'école
   * @returns {Promise<Object>} Résultat {created: [], failed: [], errors: []}
   */
  static async importerEleves(eleves, ecoleId) {
    const created = [];
    const failed = [];
    const errors = [];

    // Transaction pour garantir l'atomicité
    await sequelize.transaction(async (t) => {
      for (let i = 0; i < eleves.length; i++) {
        const eleve = eleves[i];

        try {
          // Validation
          const validationError = this.validerDonneesEleve(eleve, i);
          if (validationError) {
            errors.push(validationError);
            failed.push(eleve);
            continue;
          }

          // Créer l'utilisateur
          const newUser = await Utilisateur.create({
            pseudo: eleve.pseudo,
            nom: eleve.nom,
            prenom: eleve.prenom,
            email: eleve.email,
            mot_de_passe: eleve.mot_de_passe,
            role: 'eleve',
            ecole_id: ecoleId,
            niveau: 1,
            xp_total: 0,
            actif: true
          }, { transaction: t });

          created.push({
            id: newUser.id,
            pseudo: newUser.pseudo,
            nom: newUser.nom,
            prenom: newUser.prenom,
            email: newUser.email
          });

        } catch (error) {
          errors.push({
            row: i + 1,
            prenom: eleve.prenom,
            nom: eleve.nom,
            error: error.message || 'Erreur de création'
          });
          failed.push(eleve);
        }
      }

      // Si trop d'erreurs, rollback
      if (errors.length > 0) {
        throw {
          status: 400,
          message: 'Erreurs lors de l\'import',
          errors,
          created: [],
          failed
        };
      }
    });

    return { created, failed, errors };
  }
}

module.exports = ImportElevesService;
