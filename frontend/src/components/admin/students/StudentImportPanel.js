import React, { useState } from 'react';
import { 
  Button, 
  Alert, 
  Typography, 
  Box, 
  Card, 
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Download as DownloadIcon, 
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { downloadImportTemplate } from '../../../utils/csvHelpers';

function StudentImportPanel() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/prof/eleves/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Une erreur est survenue lors de l'import.");
        if (data.details) {
            setResult({ errors: data.details, failed: true }); 
        }
      }
    } catch (error) {
      console.error('Erreur import:', error);
      setError("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (result && result.defaultPassword) {
      navigator.clipboard.writeText(result.defaultPassword);
      alert('Mot de passe copié !');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Import d'élèves en masse
      </Typography>
      
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Instructions
        </Typography>
        <Typography variant="body2" paragraph color="text.secondary">
          Importez une liste d'élèves via CSV. Colonnes requises : <strong>Prénom</strong>, <strong>Nom</strong>.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<DownloadIcon />} 
            onClick={downloadImportTemplate}
          >
            Télécharger le modèle CSV
          </Button>
        </Box>

        <Box sx={{ 
          border: '2px dashed #ccc', 
          borderRadius: 2, 
          p: 3, 
          textAlign: 'center',
          bgcolor: '#fafafa',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': { bgcolor: '#f0f0f0' }
        }}>
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <label htmlFor="raised-button-file" style={{ width: '100%', display: 'block', cursor: 'pointer' }}>
            <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              {file ? file.name : "Cliquez pour sélectionner un fichier CSV"}
            </Typography>
          </label>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!file || loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          >
            {loading ? 'Importation...' : 'Importer les élèves'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {result && !result.failed && (
        <Card sx={{ p: 3, mb: 4, bgcolor: '#f1f8e9', border: '1px solid #c8e6c9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" color="success.main">
              Import réussi !
            </Typography>
          </Box>
          
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ {result.created} élèves créés avec succès !
          </Alert>

          <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.75rem' }}>
              Informations de connexion à transmettre :
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2">Mot de passe par défaut :</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold', bgcolor: '#eee', px: 1, borderRadius: 0.5 }}>
                {result.defaultPassword}
              </Typography>
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyPassword}>
                Copier
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Préfixe des pseudos : <strong>{result.prefixePseudo}</strong>
            </Typography>
          </Box>

          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Détails des créations :
          </Typography>
          <List dense sx={{ bgcolor: 'white', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
            {result.students.map((student, index) => (
              <React.Fragment key={student.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={`${student.prenom} ${student.nom}`}
                    secondary={
                      <Typography variant="caption" component="span" sx={{ fontFamily: 'monospace' }}>
                        Pseudo: {student.pseudo} {student.email ? `| Email: ${student.email}` : ''}
                      </Typography>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {result && result.failed && (
        <Card sx={{ p: 3, mb: 4, bgcolor: '#ffebee' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ErrorIcon color="error" sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" color="error.main">
              Erreurs lors de l'import
            </Typography>
          </Box>
           {result.errors && result.errors.length > 0 && (
            <List dense sx={{ bgcolor: 'white', borderRadius: 1 }}>
                {result.errors.map((e, index) => (
                    <ListItem key={index}>
                        <ListItemText 
                            primary={`Ligne ${e.row || '?'}: ${e.prenom || ''} ${e.nom || ''}`}
                            secondary={e.error}
                            primaryTypographyProps={{ color: 'error', fontWeight: 'bold' }}
                        />
                    </ListItem>
                ))}
            </List>
           )}
        </Card>
      )}
    </Box>
  );
}

export default StudentImportPanel;
