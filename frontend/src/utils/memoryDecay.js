/**
 * Memory Decay Utility
 * Calcule le niveau de dégradation d'une compétence basé sur la date de dernière validation
 */

/**
 * Configuration des seuils de dégradation
 */
const DECAY_CONFIG = {
  FRESH_DAYS: 30,        // 0-30j: aucun decay
  WARNING_DAYS: 90,      // 30-90j: decay léger
  CRITICAL_DAYS: 180,    // 90-180j: decay fort
  FORGOTTEN_DAYS: 365    // >180j: considéré oublié
};

/**
 * Calcule le niveau de dégradation mémoire d'une compétence
 * @param {Date|string} dateValidation - Date de la dernière validation
 * @returns {Object} Objet contenant level, opacity, color, message
 */
export function calculateDecayLevel(dateValidation) {
  if (!dateValidation) {
    return {
      level: 'not_validated',
      opacity: 1.0,
      color: 'default',
      message: null
    };
  }

  const validationDate = new Date(dateValidation);
  const now = new Date();
  const daysSince = Math.floor((now - validationDate) / (1000 * 60 * 60 * 24));

  // Fresh: 0-30 jours
  if (daysSince <= DECAY_CONFIG.FRESH_DAYS) {
    return {
      level: 'fresh',
      opacity: 1.0,
      color: 'success',
      borderStyle: 'solid',
      message: null,
      daysSince
    };
  }

  // Warning: 30-90 jours
  if (daysSince <= DECAY_CONFIG.WARNING_DAYS) {
    const decayPercent = (daysSince - DECAY_CONFIG.FRESH_DAYS) / (DECAY_CONFIG.WARNING_DAYS - DECAY_CONFIG.FRESH_DAYS);
    return {
      level: 'warning',
      opacity: 1.0 - (decayPercent * 0.2), // 1.0 → 0.8
      color: 'warning',
      borderStyle: 'dashed',
      message: `Validé il y a ${daysSince} jours - À réviser bientôt`,
      daysSince
    };
  }

  // Critical: 90-180 jours
  if (daysSince <= DECAY_CONFIG.CRITICAL_DAYS) {
    const decayPercent = (daysSince - DECAY_CONFIG.WARNING_DAYS) / (DECAY_CONFIG.CRITICAL_DAYS - DECAY_CONFIG.WARNING_DAYS);
    return {
      level: 'critical',
      opacity: 0.8 - (decayPercent * 0.2), // 0.8 → 0.6
      color: 'error',
      borderStyle: 'dashed',
      message: `⚠️ ${daysSince} jours sans révision - Révision recommandée`,
      daysSince
    };
  }

  // Forgotten: 180+ jours
  const monthsSince = Math.floor(daysSince / 30);
  return {
    level: 'forgotten',
    opacity: 0.5,
    color: 'grey',
    borderStyle: 'dashed',
    message: `🕐 Non pratiqué depuis ${monthsSince} mois - Révision urgente`,
    daysSince
  };
}

/**
 * Retourne les styles CSS pour appliquer le decay visuel
 * @param {Object} decay - Résultat de calculateDecayLevel
 * @param {Object} theme - Theme Material-UI
 * @returns {Object} Styles MUI
 */
export function getDecayStyles(decay, theme) {
  if (!decay || decay.level === 'not_validated') {
    return {};
  }

  const colorPalette = theme.palette[decay.color] || theme.palette.grey;

  return {
    opacity: decay.opacity,
    borderLeft: `4px ${decay.borderStyle} ${colorPalette.main}`,
    transition: 'all 0.3s ease',
    position: 'relative'
  };
}

/**
 * Retourne le style de filtre grayscale basé sur le decay
 * @param {Object} decay - Résultat de calculateDecayLevel
 * @returns {string} Valeur CSS pour filter
 */
export function getDecayFilter(decay) {
  if (!decay || decay.level === 'fresh' || decay.level === 'not_validated') {
    return 'none';
  }

  const grayscalePercent = Math.round((1 - decay.opacity) * 100);
  return `grayscale(${grayscalePercent}%)`;
}

const memoryDecayUtils = {
  calculateDecayLevel,
  getDecayStyles,
  getDecayFilter,
  DECAY_CONFIG
};

export default memoryDecayUtils;
