import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Hook pour gérer les classements (leaderboards)
 * Supporte 3 types de classements: global, hebdomadaire, groupe
 *
 * @param {string} type - Type de classement: 'global', 'hebdo', ou 'groupe'
 * @param {number} groupeId - ID du groupe (requis si type='groupe')
 * @param {object} options - Options: { limit, offset }
 * @returns {object} { leaderboard, userRank, loading, error, loadMore, refresh }
 */
export function useLeaderboard(type = 'global', groupeId = null, options = {}) {
  const { limit = 50, offset = 0 } = options;

  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(offset);

  const fetchLeaderboard = useCallback(async (append = false) => {
    try {
      setLoading(true);

      // Construire l'URL selon le type
      let url;
      switch (type) {
        case 'hebdo':
        case 'hebdomadaire':
          url = '/api/gamification/classements/hebdomadaire';
          break;
        case 'groupe':
          if (!groupeId) {
            throw new Error('groupeId requis pour type=groupe');
          }
          url = `/api/gamification/classements/groupe/${groupeId}`;
          break;
        case 'global':
        default:
          url = '/api/gamification/classements/global';
          break;
      }

      // Ajouter query params
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', append ? currentOffset : offset);

      const response = await api.get(`${url}?${params}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('API Classements introuvable (404). Vérifiez que le serveur backend est redémarré.');
        }
        throw new Error('Erreur chargement classement');
      }

      const data = await response.json();

      if (append) {
        setLeaderboard(prev => [...prev, ...(data.leaderboard || [])]);
      } else {
        setLeaderboard(data.leaderboard || []);
      }

      setUserRank(data.user_rank || null);

      // Vérifier s'il y a plus de données
      setHasMore((data.leaderboard || []).length === limit);

      setError(null);
    } catch (err) {
      console.error('Erreur fetch leaderboard:', err);
      setError(err.message || 'Erreur de chargement');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [type, groupeId, limit, currentOffset, offset]);

  useEffect(() => {
    setCurrentOffset(offset); // Reset offset when params change
    fetchLeaderboard(false);
  }, [type, groupeId, limit, offset]); // Note: fetchLeaderboard not in deps to avoid loop

  /**
   * Charger plus de résultats (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setCurrentOffset(prev => prev + limit);
      fetchLeaderboard(true);
    }
  }, [loading, hasMore, limit, fetchLeaderboard]);

  /**
   * Rafraîchir le classement (reset à offset 0)
   */
  const refresh = useCallback(() => {
    setCurrentOffset(0);
    fetchLeaderboard(false);
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    userRank,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}
