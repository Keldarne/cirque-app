import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export function useSuggestions(eleveId, groupeId = null, filters = {}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = groupeId
          ? `/api/prof/suggestions/groupe/${groupeId}`
          : `/api/prof/suggestions/eleve/${eleveId}`;

        const params = new URLSearchParams();
        if (filters.niveau) params.append('niveau', filters.niveau);
        if (filters.limit) params.append('limit', filters.limit);

        const res = await api.get(`${endpoint}?${params}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Erreur chargement suggestions');
        }

        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error('Erreur useSuggestions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eleveId || groupeId) {
      fetchSuggestions();
    }
  }, [eleveId, groupeId, filters.niveau, filters.limit]);

  return { suggestions, loading, error };
}