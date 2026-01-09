import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import FigureInfoStep from './FigureInfoStep';
import EtapeEditorStep from './EtapeEditorStep';
import ExerciceSelectionStep from './ExerciceSelectionStep';
import ReviewStep from './ReviewStep';
import { api } from '../../../utils/api';

const steps = ['Infos Générales', 'Étapes', 'Pré-requis', 'Validation'];

const FigureWizard = ({ initialData, onClose, onSaveSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(initialData || {
    nom: '',
    description: '',
    discipline_id: '',
    difficulty_level: 1,
    type: 'pratique',
    video_url: '',
    etapes: [],
    prerequis: [], // IDs
    prerequisObjects: [] // Full objects for UI
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateStep = (step) => {
    const newErrors = {};
    let isValid = true;

    if (step === 0) {
      if (!formData.nom) {
        newErrors.nom = 'Le nom est requis';
        isValid = false;
      }
      if (!formData.discipline_id) {
        newErrors.discipline_id = 'La discipline est requise';
        isValid = false;
      }
    }

    // Add validation for other steps if needed (e.g. at least 1 step)

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isEdit = !!formData.id;
      const url = isEdit ? `/api/admin/figures/${formData.id}` : '/api/admin/figures';
      const method = isEdit ? 'PUT' : 'POST';

      let res;
      if (method === 'POST') {
        res = await api.post(url, formData);
      } else {
        res = await api.put(url, formData);
      }

      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");

      const savedFigure = await res.json();
      if (onSaveSuccess) onSaveSuccess(savedFigure);
      if (onClose) onClose();

    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <FigureInfoStep data={formData} onChange={setFormData} errors={errors} />;
      case 1:
        return <EtapeEditorStep data={formData} onChange={setFormData} />;
      case 2:
        return <ExerciceSelectionStep data={formData} onChange={setFormData} />;
      case 3:
        return <ReviewStep data={formData} />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ mt: 4, mb: 4, minHeight: '400px' }}>
        {getStepContent(activeStep)}
      </Box>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, zIndex: 10, borderTop: 1, borderColor: 'divider' }} elevation={3}>
        <Box display="flex" justifyContent="flex-end" maxWidth="lg" mx="auto" px={2}>
          <Button
            disabled={activeStep === 0 || saving}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Retour
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              color="primary"
            >
              {saving ? <CircularProgress size={24} /> : (initialData?.id ? 'Mettre à jour' : 'Créer la Figure')}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Suivant
            </Button>
          )}
        </Box>
      </Paper>
      {/* Padding for fixed footer */}
      <Box sx={{ height: 60 }} />
    </Box>
  );
};

export default FigureWizard;
