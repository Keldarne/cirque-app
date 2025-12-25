import { useState } from 'react';

/**
 * Hook personnalisé pour gérer les formulaires de manière générique
 * @param {Object} initialValues - Valeurs initiales du formulaire
 * @returns {Object} - { formData, handleChange, resetForm, setFormData }
 */
export const useFormData = (initialValues = {}) => {
  const [formData, setFormData] = useState(initialValues);

  /**
   * Handler générique pour tous les changements de champs
   * @param {string} field - Nom du champ à modifier
   * @param {any} value - Nouvelle valeur
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handler pour les événements input HTML
   * Usage: onChange={handleInputChange}
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  /**
   * Réinitialise le formulaire aux valeurs initiales
   */
  const resetForm = () => {
    setFormData(initialValues);
  };

  /**
   * Définit plusieurs champs en même temps
   */
  const setMultipleFields = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  return {
    formData,
    handleChange,
    handleInputChange,
    resetForm,
    setFormData,
    setMultipleFields
  };
};
