import { useState, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export function useEntrainement() {
  const { refreshUser } = useAuth();
  const [session, setSession] = useState(null);
  const [currentEtapeIndex, setCurrentEtapeIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startSession = useCallback(async (figureId, selectedStepIds = null) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the figure and its steps
      const response = await api.get(`/api/figures/${figureId}`);
      if (!response.ok) throw new Error('Figure non trouvée');
      const figureData = await response.json();
      const figure = figureData.figure || figureData;

      const etapesResponse = await api.get(`/api/figures/${figure.id}/etapes`);
      const etapesData = await etapesResponse.json();

      if (!etapesData || etapesData.length === 0) {
        throw new Error('Aucune étape trouvée pour cette figure');
      }

      // Filter steps if selectedStepIds is provided
      let etapesToUse = etapesData;
      if (selectedStepIds && selectedStepIds.length > 0) {
        etapesToUse = etapesData.filter(e => selectedStepIds.includes(e.id));
        // If selection is invalid (e.g., outdated IDs), fallback to all
        if (etapesToUse.length === 0) {
            console.warn("Selected steps not found, falling back to all steps");
            etapesToUse = etapesData;
        }
      }

      const etapesQueue = etapesToUse.map(etape => ({
        ...etape,
        figureId: figure.id,
        figureNom: figure.nom,
        figureImage: figure.image_url,
        disciplineNom: figure.Discipline?.nom
      }));

      setSession({
        mode: 'figure', // New mode
        figureId,
        etapesQueue,
        tentatives: [],
        stats: {
          startTime: Date.now(),
          totalReussites: 0,
          totalEchecs: 0,
          streak: 0,
          maxStreak: 0,
          xpGagne: 0
        }
      });
      setCurrentEtapeIndex(0);
      setLoading(false);
    } catch (err) {
      console.error('Erreur démarrage session:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const recordTentative = useCallback(async (payloadInput) => {
    if (!session || currentEtapeIndex >= session.etapesQueue.length) {
      return { success: false };
    }

    const currentEtape = session.etapesQueue[currentEtapeIndex];
    
    // Normalisation: payloadInput peut être un booléen (ancien) ou un objet (nouveau)
    let payload = {};
    if (typeof payloadInput === 'boolean') {
        payload = { reussie: payloadInput, typeSaisie: 'binaire' };
    } else {
        payload = payloadInput; // { reussie, typeSaisie, score, dureeSecondes }
    }

    try {
      const response = await api.post('/api/entrainement/tentatives', {
        etapeId: currentEtape.id,
        reussite: payload.reussie, // Toujours requis pour compatibilité
        typeSaisie: payload.typeSaisie || 'binaire',
        score: payload.score,
        dureeSecondes: payload.dureeSecondes
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || "La réponse de l'API n'est pas OK");
        error.type = errorData.type;
        throw error;
      }
      
      const updatedProgression = await response.json();
      const reussie = payload.reussie;
      
      setSession(prev => {
        const newStreak = reussie ? prev.stats.streak + 1 : 0;
        const newMaxStreak = Math.max(newStreak, prev.stats.maxStreak);
        const xpGagne = reussie ? 10 : 0;

        return {
          ...prev,
          tentatives: [ ...prev.tentatives, { 
              etapeId: currentEtape.id, 
              figureId: currentEtape.figureId, 
              reussie, 
              timestamp: Date.now(), 
              xpGagne,
              // Stocker les détails riches localement aussi pour le résumé de fin
              typeSaisie: payload.typeSaisie,
              score: payload.score,
              dureeSecondes: payload.dureeSecondes
          } ],
          stats: {
            ...prev.stats,
            totalReussites: prev.stats.totalReussites + (reussie ? 1 : 0),
            totalEchecs: prev.stats.totalEchecs + (reussie ? 0 : 1),
            streak: newStreak,
            maxStreak: newMaxStreak,
            xpGagne: prev.stats.xpGagne + xpGagne
          }
        };
      });

      if (reussie) {
        await refreshUser();
      }

      return {
        success: true,
        isLastEtape: currentEtapeIndex === session.etapesQueue.length - 1,
        updatedProgression
      };
    } catch (err) {
      console.error('Erreur enregistrement tentative:', err);
      let message = err.message;
      
      if (err.type === 'ETAPE_NOT_FOUND') {
        message = "Cette étape n'existe plus ou a été modifiée.";
      } else if (err.type === 'VALIDATION_ERROR') {
        message = "Données invalides: " + err.message;
      }
      
      setError(message);
      return { success: false };
    }
  }, [session, currentEtapeIndex, refreshUser]);

  const nextEtape = useCallback(() => {
    if (!session) return false;
    if (currentEtapeIndex < session.etapesQueue.length - 1) {
      setCurrentEtapeIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [session, currentEtapeIndex]);

  const endSession = useCallback(() => {
    if (!session) return null;
    const duration = Date.now() - session.stats.startTime;
    const summary = {
      duration,
      totalTentatives: session.tentatives.length,
      totalReussites: session.stats.totalReussites,
      totalEchecs: session.stats.totalEchecs,
      maxStreak: session.stats.maxStreak,
      xpGagne: session.stats.xpGagne,
      figuresUniques: [...new Set(session.tentatives.map(t => t.figureId))].length
    };
    setSession(null);
    setCurrentEtapeIndex(0);
    return summary;
  }, [session]);

  const getCurrentEtape = useCallback(() => {
    if (!session || currentEtapeIndex >= session.etapesQueue.length) {
      return null;
    }
    return session.etapesQueue[currentEtapeIndex];
  }, [session, currentEtapeIndex]);

  const getStats = useCallback(() => {
    if (!session) return null;
    return {
      ...session.stats,
      progress: {
        current: currentEtapeIndex + 1,
        total: session.etapesQueue.length,
        percent: Math.round(((currentEtapeIndex + 1) / session.etapesQueue.length) * 100)
      }
    };
  }, [session, currentEtapeIndex]);

  return {
    session,
    loading,
    error,
    startSession,
    recordTentative,
    nextEtape,
    endSession,
    getCurrentEtape,
    getStats,
    isSessionActive: session !== null,
    isLastEtape: session ? currentEtapeIndex === session.etapesQueue.length - 1 : false
  };
}
