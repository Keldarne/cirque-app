import { useState } from 'react';

/**
 * Hook personnalisé pour gérer les étapes d'une figure
 * @param {Array} initialEtapes - Étapes initiales
 * @returns {Object} - { etapes, ajouterEtape, supprimerEtape, modifierEtape, setEtapes }
 */
export const useEtapes = (initialEtapes = [{ titre: '', description: '', xp: 10, video_url: '' }]) => {
  const [etapes, setEtapes] = useState(initialEtapes);

  /**
   * Ajoute une nouvelle étape vide
   */
  const ajouterEtape = () => {
    setEtapes(prev => [
      ...prev,
      { titre: '', description: '', xp: 10, video_url: '' }
    ]);
  };

  /**
   * Supprime une étape par index
   * @param {number} index - Index de l'étape à supprimer
   */
  const supprimerEtape = (index) => {
    setEtapes(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Modifie un champ d'une étape
   * @param {number} index - Index de l'étape
   * @param {string} field - Nom du champ
   * @param {any} value - Nouvelle valeur
   */
  const modifierEtape = (index, field, value) => {
    setEtapes(prev => {
      const nouvellesEtapes = [...prev];
      nouvellesEtapes[index] = {
        ...nouvellesEtapes[index],
        [field]: value
      };
      return nouvellesEtapes;
    });
  };

  /**
   * Réinitialise les étapes
   */
  const resetEtapes = () => {
    setEtapes(initialEtapes);
  };

  return {
    etapes,
    ajouterEtape,
    supprimerEtape,
    modifierEtape,
    setEtapes,
    resetEtapes
  };
};
