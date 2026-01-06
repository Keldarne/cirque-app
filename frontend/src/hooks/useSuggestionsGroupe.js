import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useSuggestionsGroupe(groupeId) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    if (!groupeId) {
        setSuggestions([]);
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/api/prof/suggestions/groupe/${groupeId}`);
      
      // Si 404, cela signifie souvent que le backend n'a pas été redémarré après l'ajout des nouvelles routes
      if (!response.ok) {
        if (response.status === 404) {
            console.warn("API Suggestions introuvable (404). Assurez-vous d'avoir redémarré le serveur Backend.");
        }
        throw new Error('Erreur chargement suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setError(null);
    } catch (err) {
      console.error('Erreur fetch suggestions groupe:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [groupeId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const assignerFigure = async (figureId) => {
    try {
      const response = await api.post(`/api/prof/suggestions/groupe/${groupeId}/assigner/${figureId}`);
      if (!response.ok) throw new Error('Erreur lors de l\'assignation');
      fetchSuggestions(); // Rafraîchir
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
