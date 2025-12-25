import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Alert, CircularProgress, Chip } from '@mui/material';
import { 
  CalendarToday as CalendarIcon, 
  Schedule as ScheduleIcon, 
  TrendingUp as TrendingIcon,
  Timer as TimerIcon,
  Visibility as VisibilityIcon,
  Bolt as BoltIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import ProgressBar from '../common/ProgressBar';
import { calculateDecayLevel } from '../../utils/memoryDecay';
import { api } from '../../utils/api';

// Configuration des délais de révision
const DECAY_CONFIG = {
  FRESH_DAYS: 30
};

/**
 * JournalProgression - Journal d'avancement et révisions recommandées
 * Affiche les stats de mémoire et l'historique réel des entraînements.
 *
 * @param {object} figure - Données de la figure
 * @param {object} progression - Données de progression utilisateur
 */
function JournalProgression({
  figure,
  progression,
  sx = {}
}) {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger l'historique réel quand le composant monte
  useEffect(() => {
    const fetchHistorique = async () => {
      // On a besoin des étapes pour chercher leur historique
      // Les étapes peuvent être dans figure.etapes ou figure.EtapesProgressions
      const etapes = figure.etapes || figure.EtapesProgressions || [];
      
      if (etapes.length === 0) {
        setHistorique([]);
        return;
      }

      setLoading(true);
      try {
        // Lancer une requête pour chaque étape (limitée aux 5 dernières tentatives)
        const promises = etapes.map(etape => {
          // Utiliser etape_id si dispo (notre objet fusionné), sinon chercher dans l'objet imbriqué etape, sinon etape.id
          const idToQuery = etape.etape_id || (etape.etape && etape.etape.id) || etape.id;
          
          // Ignorer si l'ID est "virtual-XX" (ne devrait pas arriver avec etape_id)
          if (typeof idToQuery === 'string' && idToQuery.startsWith('virtual')) return Promise.resolve([]);

          return api.get(`/api/entrainement/tentatives/${idToQuery}?limit=5`)
            .then(res => res.ok ? res.json() : [])
            .then(data => data.map(t => ({ 
              ...t, 
              etapeNom: etape.etape?.titre || etape.titre || etape.nom || `Étape ${etape.ordre || etape.etape?.ordre}` 
            })))
            .catch(() => [])
        });

        const results = await Promise.all(promises);
        
        // Aplatir, trier par date décroissante et prendre les 20 derniers événements globaux
        const allTentatives = results.flat()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 20);

        setHistorique(allTentatives);
      } catch (err) {
        console.error("Erreur chargement historique:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorique();
  }, [figure]);

  if (!progression) {
    return (
      <Alert severity="info" sx={sx}>
        Aucune donnée de progression disponible.
      </Alert>
    );
  }

  const derniereValidation = progression.date_derniere_validation || progression.date_validation;
  const decayInfo = calculateDecayLevel(derniereValidation);

  // Calculer prochaine révision recommandée (30 jours après validation)
  const calculateProchaineRevision = () => {
    if (!derniereValidation) return null;

    const dateValidation = new Date(derniereValidation);
    const prochaineRevision = new Date(dateValidation);
    prochaineRevision.setDate(prochaineRevision.getDate() + DECAY_CONFIG.FRESH_DAYS);

    return prochaineRevision;
  };

  const prochaineRevision = calculateProchaineRevision();

  // Calculer jours restants
  const joursRestants = () => {
    if (!prochaineRevision) return 0;

    const maintenant = new Date();
    const diffTime = prochaineRevision - maintenant;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const jours = joursRestants();

  // Helper pour afficher le détail d'une tentative
  const renderTentativeDetails = (t) => {
    let details = [];
    
    // Badge de Mode
    let modeLabel = "Rapide";
    let ModeIcon = CheckCircleIcon;
    let modeColor = "default";

    if (t.type_saisie === 'duree') { modeLabel = "Chrono"; ModeIcon = TimerIcon; modeColor = "secondary"; }
    else if (t.type_saisie === 'evaluation') { modeLabel = "Focus"; ModeIcon = VisibilityIcon; modeColor = "primary"; }
    else if (t.type_saisie === 'evaluation_duree') { modeLabel = "Combiné"; ModeIcon = BoltIcon; modeColor = "warning"; }

    details.push(
      <Chip 
        key="mode"
        icon={<ModeIcon style={{ fontSize: 14 }} />}
        label={modeLabel}
        size="small"
        color={modeColor}
        variant="outlined"
        sx={{ height: 20, fontSize: '0.7rem', mr: 0.5 }}
      />
    );

    // Durée
    if (t.type_saisie === 'duree' || t.type_saisie === 'evaluation_duree') {
      const minutes = Math.floor(t.duree_secondes / 60);
      const secondes = t.duree_secondes % 60;
      details.push(
        <Chip 
          key="duree" 
          icon={<TimerIcon style={{ fontSize: 14 }} />} 
          label={`${minutes}m ${secondes}s`} 
          size="small" 
          variant="outlined" 
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      );
    }
    
    // Score / Évaluation
    if (t.type_saisie === 'evaluation' || t.type_saisie === 'evaluation_duree') {
      let label = 'Moyen';
      let color = 'warning';
      if (t.score === 3) { label = 'Maîtrisé'; color = 'success'; }
      if (t.score === 1) { label = 'À revoir'; color = 'error'; }
      
      details.push(
        <Chip 
          key="eval" 
          icon={<VisibilityIcon style={{ fontSize: 14 }} />} 
          label={label} 
          size="small" 
          color={color}
          variant="outlined"
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      );
    }

    // Résultat simple (Binaire ou fallback)
    if (t.type_saisie === 'binaire' || (!t.type_saisie && !t.score)) {
       details.push(
        <Typography key="bin" variant="caption" color={t.reussie ? "success.main" : "error.main"} fontWeight="bold">
          {t.reussie ? "Réussi" : "Échoué"}
        </Typography>
       );
    }

    return (
      <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
        {details}
      </Box>
    );
  };

  return (
    <Box sx={sx}>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <CalendarIcon /> Prochaines Révisions
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Dernière validation */}
      {derniereValidation ? (
        <Box mb={3}>
          <Typography variant="body1" display="flex" alignItems="center" gap={1} mb={1}>
            ✅ Dernière validation: {new Date(derniereValidation).toLocaleDateString('fr-FR')}
          </Typography>

          {prochaineRevision && (
            <Typography variant="body1" display="flex" alignItems="center" gap={1} mb={2}>
              <ScheduleIcon fontSize="small" />
              Prochaine révision: {prochaineRevision.toLocaleDateString('fr-FR')} ({DECAY_CONFIG.FRESH_DAYS} jours)
            </Typography>
          )}

          {jours > 0 && (
            <Box>
              <ProgressBar
                value={((DECAY_CONFIG.FRESH_DAYS - jours) / DECAY_CONFIG.FRESH_DAYS) * 100}
                label={`Jours restants: ${jours}`}
                size="medium"
                color="auto"
              />
            </Box>
          )}

          {jours <= 0 && prochaineRevision && (
            <Alert severity="warning">
              La période de révision recommandée est dépassée !
            </Alert>
          )}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Figure non validée. Entraînez-vous pour valider toutes les étapes !
        </Alert>
      )}

      {/* État de mémoire */}
      {derniereValidation && decayInfo.level !== 'not_validated' && (
        <Alert
          severity={
            decayInfo.level === 'fresh' ? 'success' :
            decayInfo.level === 'warning' ? 'warning' :
            decayInfo.level === 'critical' ? 'error' :
            'info'
          }
          sx={{ mb: 3 }}
        >
          {decayInfo.message}
        </Alert>
      )}

      {/* Historique Réel */}
      <Box>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <TrendingIcon /> Historique d'entraînement
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : historique.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aucune session récente enregistrée.
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
            {historique.map((entry) => (
              <Box 
                key={entry.id} 
                mb={1.5} 
                p={1.5} 
                bgcolor="grey.50" 
                borderRadius={1}
                borderLeft={`4px solid ${entry.reussie ? '#4caf50' : '#f44336'}`}
              >
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={0.5}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {entry.etapeNom}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                
                {renderTentativeDetails(entry)}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default JournalProgression;
