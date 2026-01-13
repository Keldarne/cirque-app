/**
 * JugglingLabService
 *
 * Service pour générer et cacher les GIFs JugglingLab
 *
 * Responsabilités:
 * - Générer des GIFs depuis l'API JugglingLab (jugglinglab.org/anim)
 * - Sauvegarder les GIFs dans le filesystem (public/gifs/)
 * - Gérer le cache (éviter régénération, suppression)
 * - Gestion d'erreurs non-bloquante (retourne null en cas d'échec)
 *
 * Architecture:
 * - Fichiers nommés: {figureId}-{siteswapHash}.gif
 * - Validation: Vérifie le magic number GIF (GIF87a/GIF89a)
 * - Timeout: 15 secondes max pour l'API JugglingLab
 * - Idempotent: Ne régénère pas si le fichier existe déjà
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class JugglingLabService {
  static GIF_BASE_DIR = path.join(__dirname, '..', '..', 'public', 'gifs');
  static GIF_PUBLIC_PATH = '/gifs';
  static JUGGLINGLAB_BASE_URL = 'https://jugglinglab.org/anim';

  /**
   * Génère et cache un GIF JugglingLab pour un pattern siteswap
   *
   * @param {number} figureId - ID de la figure
   * @param {string} siteswap - Pattern siteswap (ex: "531", "3", "97531")
   * @param {object} options - Options JugglingLab (fps, height, width, bps)
   * @returns {Promise<string|null>} - URL publique (ex: "/gifs/123-a3f2.gif") ou null si échec
   */
  static async generateAndCacheGif(figureId, siteswap, options = {}) {
    try {
      // 1. Validation des entrées
      if (!figureId || !siteswap) {
        console.warn('[JugglingLabService] Missing figureId or siteswap');
        return null;
      }

      // 2. S'assurer que le répertoire existe
      await this._ensureGifDirectory();

      // 3. Générer le nom de fichier: {figureId}-{siteswapHash}.gif
      const filename = this._generateFilename(figureId, siteswap);
      const filePath = path.join(this.GIF_BASE_DIR, filename);

      // 4. Vérifier si le GIF existe déjà (éviter régénération)
      const exists = await this._fileExists(filePath);
      if (exists) {
        console.log(`[JugglingLabService] Using existing GIF: ${filename}`);
        return `${this.GIF_PUBLIC_PATH}/${filename}`;
      }

      // 5. Construire l'URL JugglingLab
      const gifUrl = this._buildJugglingLabUrl(siteswap, options);
      console.log(`[JugglingLabService] Fetching GIF from: ${gifUrl}`);

      // 6. Récupérer le GIF depuis l'API JugglingLab
      const response = await axios.get(gifUrl, {
        responseType: 'arraybuffer',
        timeout: 15000, // 15 secondes timeout
        headers: {
          'User-Agent': 'CirqueApp/1.0'
        }
      });

      // 7. Valider que la réponse est bien un GIF
      if (!this._isValidGif(response.data)) {
        throw new Error('Invalid GIF data received from JugglingLab');
      }

      // 8. Écrire le fichier sur le disque
      await fs.writeFile(filePath, response.data);
      console.log(`[JugglingLabService] ✅ GIF cached: ${filename} (${response.data.length} bytes)`);

      // 9. Retourner l'URL publique
      return `${this.GIF_PUBLIC_PATH}/${filename}`;

    } catch (error) {
      // Gestion d'erreur non-bloquante: log l'erreur et retourne null
      console.error(`[JugglingLabService] ❌ Failed to generate GIF for figure ${figureId}:`, error.message);
      if (error.code === 'ECONNABORTED') {
        console.error('[JugglingLabService] Timeout while fetching GIF from JugglingLab');
      } else if (error.response) {
        console.error(`[JugglingLabService] JugglingLab API error: ${error.response.status}`);
      }
      return null;
    }
  }

  /**
   * Supprime un GIF caché
   *
   * @param {string} gifUrl - URL publique (ex: "/gifs/123-a3f2.gif")
   * @returns {Promise<boolean>} - True si supprimé avec succès
   */
  static async deleteCachedGif(gifUrl) {
    try {
      if (!gifUrl) return false;

      const filename = path.basename(gifUrl);
      const filePath = path.join(this.GIF_BASE_DIR, filename);

      const exists = await this._fileExists(filePath);
      if (exists) {
        await fs.unlink(filePath);
        console.log(`[JugglingLabService] Deleted GIF: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[JugglingLabService] Error deleting GIF:', error.message);
      return false;
    }
  }

  /**
   * Vérifie si le siteswap a changé (nécessite régénération)
   *
   * @param {object} oldMetadata - Ancien metadata.siteswap
   * @param {object} newMetadata - Nouveau metadata.siteswap
   * @returns {boolean} - True si le siteswap a changé
   */
  static hasSiteswapChanged(oldMetadata, newMetadata) {
    if (!oldMetadata?.siteswap && !newMetadata?.siteswap) return false;
    return oldMetadata?.siteswap !== newMetadata?.siteswap;
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * S'assure que le répertoire de cache existe
   * @private
   */
  static async _ensureGifDirectory() {
    try {
      await fs.access(this.GIF_BASE_DIR);
    } catch (error) {
      // Le répertoire n'existe pas, on le crée
      await fs.mkdir(this.GIF_BASE_DIR, { recursive: true });
      console.log(`[JugglingLabService] Created directory: ${this.GIF_BASE_DIR}`);
    }
  }

  /**
   * Génère un nom de fichier unique basé sur figureId et siteswap
   * Format: {figureId}-{siteswapHash}.gif
   *
   * @private
   * @param {number} figureId - ID de la figure
   * @param {string} siteswap - Pattern siteswap
   * @returns {string} - Nom de fichier (ex: "123-a3f2b5c8.gif")
   */
  static _generateFilename(figureId, siteswap) {
    // Hash MD5 du siteswap pour créer un identifiant court et URL-safe
    const hash = crypto.createHash('md5').update(siteswap).digest('hex').substring(0, 8);
    return `${figureId}-${hash}.gif`;
  }

  /**
   * Vérifie si un fichier existe
   * @private
   */
  static async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Construit l'URL de l'API JugglingLab
   *
   * @private
   * @param {string} siteswap - Pattern siteswap
   * @param {object} options - Options (fps, height, width, bps)
   * @returns {string} - URL complète
   */
  static _buildJugglingLabUrl(siteswap, options = {}) {
    const params = [];
    params.push(`pattern=${encodeURIComponent(siteswap)}`);
    params.push('redirect=true'); // Force réponse GIF directe

    // Options par défaut (optimisées pour performance)
    const defaults = {
      fps: 12,      // 12 FPS au lieu de 30 pour génération plus rapide
      height: 200,  // Hauteur modérée
      width: 300    // Largeur modérée
    };

    const finalOptions = { ...defaults, ...options };
    Object.entries(finalOptions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.push(`${key}=${value}`);
      }
    });

    // Format JugglingLab: paramètres séparés par ";"
    return `${this.JUGGLINGLAB_BASE_URL}?${params.join(';')}`;
  }

  /**
   * Valide qu'un buffer est bien un GIF
   * Vérifie le magic number: 'GIF87a' ou 'GIF89a'
   *
   * @private
   * @param {Buffer} buffer - Données binaires
   * @returns {boolean} - True si GIF valide
   */
  static _isValidGif(buffer) {
    if (!buffer || buffer.length < 6) return false;
    const header = buffer.toString('ascii', 0, 6);
    return header === 'GIF87a' || header === 'GIF89a';
  }
}

module.exports = JugglingLabService;
