/**
 * Vérifie si une URL est valide pour l'affichage (image ou vidéo).
 * Rejette les placeholders comme "[URL]" ou les chaînes vides.
 * 
 * @param {string} url - L'URL à vérifier
 * @returns {boolean} - True si l'URL semble valide
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Doit commencer par http:// ou https:// pour être considéré comme une ressource externe valide
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
};
