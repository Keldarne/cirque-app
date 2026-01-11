import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook pour charger les programmes d'un professeur
 */
export const useProgrammesProf = () => {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgrammes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/prof/programmes');
      if (!response.ok) throw new Error('Erreur chargement programmes');
      const data = await response.json();
      setProgrammes(data.programmes || []);
    } catch (err) {
      console.error('Erreur useProgrammesProf:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgrammes();
  }, [fetchProgrammes]);

  return { programmes, loading, error, refetch: fetchProgrammes };
};

/**
 * Hook pour charger la progression d'un élève (les figures et leurs étapes)
 * @param {number} utilisateurId - L'ID de l'élève
 */
export const useProgressionEleve = (utilisateurId) => {
  const [progression, setProgression] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgression = useCallback(async () => {
    if (!utilisateurId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/progression/utilisateur/${utilisateurId}`);
      if (!response.ok) throw new Error('Erreur chargement de la progression');
      const data = await response.json();
      setProgression(data || []);
    } catch (err) {
      console.error('Erreur useProgressionEleve:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [utilisateurId]);

  useEffect(() => {
    fetchProgression();
  }, [fetchProgression]);

  return { progression, loading, error, refetch: fetchProgression };
};

/**
 * Hook pour charger les programmes assignés à l'élève connecté
 */
export const useProgrammesAssignes = () => {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgrammes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/progression/programmes');
      if (!response.ok) throw new Error('Erreur chargement programmes assignés');
      const data = await response.json();
      setProgrammes(data || []);
    } catch (err) {
      console.error('Erreur useProgrammesAssignes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgrammes();
  }, [fetchProgrammes]);

  return { programmes, loading, error, refetch: fetchProgrammes };
};

/**
 * Hook pour charger les détails d'un programme spécifique (vue élève)
 */
export const useProgrammeDetails = (programmeId) => {
  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!programmeId) {
      setProgramme(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/progression/programmes/${programmeId}`);
      if (!response.ok) throw new Error('Erreur chargement programme');
      const data = await response.json();
      setProgramme(data.programme);
    } catch (err) {
      console.error('Erreur useProgrammeDetails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [programmeId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { programme, loading, error, refetch: fetchDetails };
};


/**
 * Hook pour gérer les programmes personnels (création, modification, suppression)
 */
export const usePersonalProgrammeMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createProgramme = async ({ nom, description }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/progression/programmes', {
        nom,
        description,
        figureIds: []
      });
      if (!response.ok) throw new Error('Erreur création programme');
      const data = await response.json();
      setLoading(false);
      return data.programme;
    } catch (err) {
      console.error('Erreur createProgramme:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const updateProgramme = async (id, { nom, description }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/api/progression/programmes/${id}`, {
        nom,
        description
      });
      if (!response.ok) throw new Error('Erreur modification programme');
      const data = await response.json();
      setLoading(false);
      return data.programme;
    } catch (err) {
      console.error('Erreur updateProgramme:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const deleteProgramme = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/api/progression/programmes/${id}`);
      if (!response.ok) throw new Error('Erreur suppression programme');
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Erreur deleteProgramme:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const removeFigure = async (programmeId, figureId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/api/progression/programmes/${programmeId}/figures/${figureId}`);
      if (!response.ok) throw new Error('Erreur suppression figure');
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Erreur removeFigure:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { createProgramme, updateProgramme, deleteProgramme, removeFigure, loading, error };
};

export const useCreateProgramme = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createProgramme = async ({ nom, description, figureIds, estModele = false }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/prof/programmes', {
        nom,
        description,
        figureIds,
        estModele
      });
      if (!response.ok) throw new Error('Erreur création programme');
      const data = await response.json();
      setLoading(false);
      return data.programme;
    } catch (err) {
      console.error('Erreur useCreateProgramme:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { createProgramme, loading, error };
};


/**
 * Hook pour supprimer un programme
 */
export const useDeleteProgramme = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteProgramme = async (programmeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/api/prof/programmes/${programmeId}`);
      if (!response.ok) throw new Error('Erreur suppression programme');
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Erreur useDeleteProgramme:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { deleteProgramme, loading, error };
};

/**
 * Hook pour charger toutes les figures disponibles
 */
export const useFigures = () => {
  const [figures, setFigures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Utiliser le contexte auth pour filtrage

  useEffect(() => {
    const fetchFigures = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/figures');
        if (!response.ok) throw new Error('Erreur chargement figures');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Filtrage selon les règles métier:
          // 1. Admin (Propriétaire): Voit tout le catalogue (public + écoles)
          // 2. Autres (Prof/Eleve): Uniquement les figures de leur école (ecole_id match)
          // 3. Le catalogue public (ecole_id null) est réservé aux admins.
          
          let filtered = data;
          
          if (user?.role === 'admin') {
            // L'admin est le propriétaire, il voit tout
            filtered = data;
          } else if (user?.ecole_id) {
            // Les utilisateurs rattachés voient uniquement leur école (exclut le public)
            filtered = data.filter(f => f.ecole_id === user.ecole_id);
          } else {
            // Utilisateur sans école et non-admin: Ne voit rien (protection catalogue public)
            filtered = [];
          }
          
          setFigures(filtered);
        } else {
          setFigures([]);
        }
      } catch (err) {
        console.error('Erreur useFigures:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFigures();
  }, [user]);

  return { figures, loading, error };
};

