import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/suggestions');
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setError(null);
    } catch (err) {
      console.error('Erreur fetch suggestions:', err);
      // Gérer le cas où l'API n'existe pas encore ou renvoie une erreur
      setError(err.message || 'Erreur de chargement');
      setSuggestions([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const accepterSuggestion = async (figureId) => {
    try {
      const response = await api.post(`/api/suggestions/${figureId}/accepter`);
      if (!response.ok) throw new Error('Erreur lors de l\'acceptation');
      fetchSuggestions(); // Rafraîchir
      return { success: true };
    } catch (err) {
      console.error('Erreur accepter suggestion:', err);
      return {
        success: false,
        error: err.message || 'Erreur inconnue'
      };
    }
  };

  const dismisserSuggestion = async (figureId) => {
    try {
      const response = await api.post(`/api/suggestions/${figureId}/dismisser`);
      if (!response.ok) throw new Error('Erreur lors du masquage');
      // Retirer immédiatement de l'affichage localement pour meilleure réactivité
      setSuggestions(prev => prev.filter(s => s.figure_id !== figureId));
      return { success: true };
    } catch (err) {
      console.error('Erreur dismisser suggestion:', err);
      return { success: false };
    }
  };

  const obtenirDetails = async (figureId) => {
    try {
      const response = await api.get(`/api/suggestions/${figureId}/details`);
      return await response.json();
    } catch (err) {
      console.error('Erreur détails suggestion:', err);
      return null;
    }
  };

  return {
    suggestions,
    loading,
    error,
    accepterSuggestion,
    dismisserSuggestion,
    obtenirDetails,
    refresh: fetchSuggestions
  };
}
