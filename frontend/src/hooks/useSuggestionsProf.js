import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Hook pour gérer les suggestions intelligentes pour un élève (vue professeur)
 * Endpoint: GET /api/prof/suggestions/eleve/:eleveId
 *
 * @param {number} eleveId - ID de l'élève
 * @param {object} filters - Filtres optionnels (niveau, limit)
 * @returns {object} { suggestions, loading, error, refresh, assignerFigure }
 */
export function useSuggestionsProf(eleveId, filters = {}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    if (!eleveId) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Construire URL avec query params
      const params = new URLSearchParams();
      if (filters.niveau) params.append('niveau', filters.niveau);
      if (filters.limit) params.append('limit', filters.limit);

      const url = `/api/prof/suggestions/eleve/${eleveId}${params.toString() ? `?${params}` : ''}`;
      const response = await api.get(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('API Suggestions prof introuvable (404). Assurez-vous d\'avoir redémarré le serveur backend.');
        }
        throw new Error('Erreur chargement suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setError(null);
    } catch (err) {
      console.error('Erreur fetch suggestions élève:', err);
      setError(err.message || 'Erreur de chargement');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [eleveId, JSON.stringify(filters)]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  /**
   * Assigner une figure suggérée au programme de l'élève
   * @param {number} figureId - ID de la figure à assigner
   */
  const assignerFigure = async (figureId) => {
    try {
      // Utilise l'endpoint d'assignation de programme
      const response = await api.post(`/api/prof/eleves/${eleveId}/programmes/assigner`, {
        figure_id: figureId
      });

      if (!response.ok) throw new Error('Erreur lors de l\'assignation');

      // Rafraîchir les suggestions après assignation
      await fetchSuggestions();

      return { success: true };
    } catch (err) {
      console.error('Erreur assigner figure:', err);
      return {
        success: false,
        error: err.message || 'Erreur inconnue'
      };
    }
  };

  return {
    suggestions,
    loading,
    error,
    assignerFigure,
    refresh: fetchSuggestions
  };
}
