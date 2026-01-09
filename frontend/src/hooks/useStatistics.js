import { useState, useEffect } from 'react';
import { api } from '../utils/api';

/**
 * Hook pour charger les statistiques d'un élève
 * Utilisé dans la page ProfilPage
 *
 * @param {number} userId - ID de l'utilisateur
 * @returns {object} - { stats, loading, error }
 */
export const useStatistics = (userId) => {
  const [stats, setStats] = useState({
    securite: null,
    decrochage: null,
    polyvalence: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // Endpoint optimisé : 1 seul appel API pour toutes les stats
        const response = await api.get(`/api/statistiques/eleve/${userId}/dashboard`);

        if (!response.ok) {
          throw new Error('Erreur chargement statistiques');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Erreur useStatistics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading, error };
};

/**
 * Hook pour charger les analytics d'un professeur
 * Utilisé dans la page DashboardProfPage
 *
 * @returns {object} - { analytics, loading, error }
 */
export const useProfAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    meteo_classe: null,
    top_figures_bloquantes: [],
    eleves_a_risque: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/statistiques/prof/analytics');

        if (!response.ok) {
          throw new Error('Erreur chargement analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Erreur useProfAnalytics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [refreshTrigger]); // Dépend de refreshTrigger pour forcer le rechargement

  // Fonction pour forcer le refresh
  const refresh = () => setRefreshTrigger(prev => prev + 1);

  return { analytics, loading, error, refresh };
};

/**
 * Hook pour charger les élèves négligés (sans interaction >X jours)
 * Utilisé dans DashboardProfPage
 *
 * @param {number} seuilJours - Seuil en jours (défaut: 30)
 * @returns {object} - { data, loading, error }
 */
export const useElevesNegliges = (seuilJours = 30) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchElevesNegliges = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/api/prof/statistiques/eleves-negliges?seuil_jours=${seuilJours}`);
        setData(response);
      } catch (err) {
        console.error('Erreur useElevesNegliges:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchElevesNegliges();
  }, [seuilJours]);

  return { data, loading, error };
};

/**
 * Hook pour charger le Grit Score d'un utilisateur
 * Utilisé dans ProfilPage
 *
 * @param {number} userId - ID de l'utilisateur
 * @returns {object} - { data, loading, error }
 */
export const useGritScore = (userId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchGritScore = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/progression/grit-score');
        if (!response.ok) {
          throw new Error('Erreur chargement grit score');
        }
        const data = await response.json();
        setData(data.grit_score);
      } catch (err) {
        console.error('Erreur useGritScore:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGritScore();
  }, [userId]);

  return { data, loading, error };
};
