import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';

/**
 * Composant pour visualiser une animation JugglingLab à partir d'un siteswap.
 * Utilise le proxy backend avec cache pour des performances optimales.
 *
 * @param {string} siteswap - Le code siteswap (ex: "531", "3")
 * @param {object} options - Options supplémentaires (non utilisées, gardées pour compatibilité)
 * @param {number} height - Hauteur de l'image
 */
const SiteswapVisualizer = ({ siteswap: rawSiteswap, options = {}, height = 200 }) => {
  // Conversion sécurisée en string (ex: le siteswap 441 peut arriver comme nombre 441)
  const siteswap = rawSiteswap ? String(rawSiteswap) : null;
  
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!siteswap) {
      setImageUrl('');
      return;
    }

    setLoading(true);
    setError(false);

    // Nouvelle URL vers le proxy backend avec cache
    // Le backend gère le téléchargement depuis JugglingLab et le cache local
    const url = `/api/figures/siteswap/${siteswap}.gif`;

    // Préchargement de l'image pour vérifier si elle existe/charge
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImageUrl(url);
      setLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };

  }, [siteswap, options, height]);

  if (!siteswap) return null;

  if (error) {
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          height: height, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.100',
          color: 'error.main',
          p: 2,
          textAlign: 'center'
        }}
      >
        <BrokenImageOutlinedIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="caption" fontWeight="bold">
          Erreur JugglingLab
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 0.5 }}>
          Pattern: "{siteswap}"
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative', 
      height: height, 
      width: '100%',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: loading ? 'grey.50' : 'transparent',
      borderRadius: 1,
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {loading && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1
          }}
        >
          <CircularProgress size={30} thickness={4} />
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Génération JugglingLab...
          </Typography>
        </Box>
      )}
      
      {imageUrl && !loading && (
        <img 
          src={imageUrl} 
          alt={`Animation siteswap ${siteswap}`}
          style={{ 
            height: '100%', 
            maxWidth: '100%', 
            objectFit: 'contain',
            borderRadius: 4
          }} 
        />
      )}
    </Box>
  );
};

export default SiteswapVisualizer;
