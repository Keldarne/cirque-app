import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

function AuthPage() {
  // UI: deux onglets (connexion / inscription)
  // tabValue === 0 -> formulaire de connexion
  // tabValue === 1 -> formulaire d'inscription
  const [tabValue, setTabValue] = useState(0);

  // formData : état du formulaire (réutilisé pour les deux onglets)
  const [formData, setFormData] = useState({
    pseudo: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hooks du contexte d'auth et navigation
  // login / register proviennent de AuthContext
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Change d'onglet et réinitialise les erreurs / champs
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setFormData({
      pseudo: '',
      email: '',
      motDePasse: '',
      confirmMotDePasse: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  // Soumet le formulaire de connexion
  // Utilise login(pseudo, motDePasse) depuis le contexte
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.pseudo || !formData.motDePasse) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    const result = await login(formData.pseudo, formData.motDePasse);

    if (result.success) {
      navigate('/profil');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Soumet le formulaire d'inscription
  // Valide localement les champs puis appelle register()
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.pseudo || !formData.email || !formData.motDePasse) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    const result = await register(formData.pseudo, formData.email, formData.motDePasse);

    if (result.success) {
      navigate('/profil');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Cirque App
        </Typography>

        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
          <Tab label="Connexion" />
          <Tab label="Inscription" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Formulaire de connexion */}
        {tabValue === 0 && (
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Pseudo ou Email"
              name="pseudo"
              value={formData.pseudo}
              onChange={handleChange}
              margin="normal"
              autoComplete="username"
              placeholder="Ex: marie.dubois ou marie.dubois@prof.fr"
            />
            <TextField
              fullWidth
              label="Mot de passe"
              name="motDePasse"
              type="password"
              value={formData.motDePasse}
              onChange={handleChange}
              margin="normal"
              autoComplete="current-password"
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </Box>
        )}

        {/* Formulaire d'inscription */}
        {tabValue === 1 && (
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Pseudo"
              name="pseudo"
              value={formData.pseudo}
              onChange={handleChange}
              margin="normal"
              autoComplete="username"
              helperText="3-50 caractères"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Mot de passe"
              name="motDePasse"
              type="password"
              value={formData.motDePasse}
              onChange={handleChange}
              margin="normal"
              autoComplete="new-password"
              helperText="Minimum 6 caractères"
            />
            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              name="confirmMotDePasse"
              type="password"
              value={formData.confirmMotDePasse}
              onChange={handleChange}
              margin="normal"
              autoComplete="new-password"
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default AuthPage;
