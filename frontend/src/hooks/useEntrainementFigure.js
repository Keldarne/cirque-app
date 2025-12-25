import { useState, useEffect } from 'react';
import { api } from '../utils/api';

/**
 * Hook pour charger les données nécessaires à une session d'entraînement pour une figure spécifique.
 * @param {number} figureId - L'ID de la figure.
 */
export const useEntrainementFigure = (figureId) => {
  const [figure, setFigure] = useState(null);
  const [etapes, setEtapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!figureId) {
      setLoading(false);
      return;
    }

    const fetchFigureData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Charger les détails de la figure
        // 2. Charger les étapes théoriques (définition de la figure)
        // 3. Charger la progression de l'utilisateur (ce qu'il a déjà fait)
        const [figureRes, etapesRes, progressionRes] = await Promise.all([
          api.get(`/api/figures/${figureId}`),
          api.get(`/api/figures/${figureId}/etapes`),
          api.get(`/api/progression/figure/${figureId}/etapes`)
        ]);

        if (!figureRes.ok) throw new Error('Figure non trouvée');
        // Note: progressionRes might return [] if not started, which is fine, but if it 404s/500s that's an issue. 
        // Our API returns 200 [] usually.

        const figureData = await figureRes.json();
        const etapesTheoriques = await etapesRes.json(); // Array of EtapeProgression
        const progressionData = await progressionRes.json(); // Array of ProgressionEtape

        // Use figure object wrapper if present (API returns { figure: ... })
        setFigure(figureData.figure || figureData);

        // Fusionner: Pour chaque étape théorique, attacher la progression correspondante (ou créer un placeholder)
        const mergedEtapes = Array.isArray(etapesTheoriques) ? etapesTheoriques.map(etape => {
          const prog = Array.isArray(progressionData) 
            ? progressionData.find(p => p.etape_id === etape.id) 
            : null;

          return {
            id: prog ? prog.id : `virtual-${etape.id}`,
            etape_id: etape.id,
            statut: prog ? prog.statut : 'non_commence',
            date_validation: prog ? prog.date_validation : null,
            utilisateur_id: prog ? prog.utilisateur_id : null,
            etape: etape // L'objet étape complet (titre, desc, ordre...)
          };
        }) : [];

        // Trier par ordre
        mergedEtapes.sort((a, b) => (a.etape?.ordre || 0) - (b.etape?.ordre || 0));

        setEtapes(mergedEtapes);

      } catch (err) {
        console.error('Erreur dans useEntrainementFigure:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFigureData();
  }, [figureId]);

  return { figure, etapes, loading, error };
};
