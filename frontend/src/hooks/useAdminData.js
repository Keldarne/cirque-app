import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

/**
 * Hook personnalisé pour gérer les données de la page admin
 * Charge automatiquement les disciplines et figures
 * Gère la redirection si l'utilisateur n'est pas authentifié
 */
export const useAdminData = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [disciplines, setDisciplines] = useState([]);
  const [figures, setFigures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Attendre que le chargement initial soit terminé
    if (loading) {
      return;
    }

    // Rediriger si non authentifié
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Fonction pour charger les données
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Charger disciplines et figures en parallèle
        const [disciplinesRes, figuresRes] = await Promise.all([
          api.get('/api/disciplines'),
          api.get('/api/figures')
        ]);

        if (!disciplinesRes.ok || !figuresRes.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const disciplinesData = await disciplinesRes.json();
        const figuresData = await figuresRes.json();

        setDisciplines(disciplinesData);
        setFigures(figuresData);
        setError(null);
      } catch (err) {
        console.error('Erreur chargement données admin:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isAuthenticated, navigate, loading]);

  // Fonctions helper pour recharger les données
  const reloadDisciplines = async () => {
    try {
      const res = await api.get('/api/disciplines');
      const data = await res.json();
      setDisciplines(data);
    } catch (err) {
      console.error('Erreur rechargement disciplines:', err);
    }
  };

  const reloadFigures = async () => {
    try {
      const res = await api.get('/api/figures');
      const data = await res.json();
      setFigures(data);
    } catch (err) {
      console.error('Erreur rechargement figures:', err);
    }
  };

  return {
    disciplines,
    figures,
    setDisciplines,
    setFigures,
    isLoading,
    error,
    reloadDisciplines,
    reloadFigures,
    user
  };
};
