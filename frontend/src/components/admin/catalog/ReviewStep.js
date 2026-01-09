import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';

const ReviewStep = ({ data }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Récapitulatif
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Nom</Typography>
            <Typography variant="body1" fontWeight="bold">{data.nom}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">Discipline ID</Typography>
            <Typography variant="body1">{data.discipline_id || 'Non défini'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">Description</Typography>
            <Typography variant="body1">{data.description || 'Aucune'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="textSecondary">Difficulté</Typography>
            <Typography variant="body1">{data.difficulty_level}/10</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="textSecondary">Type</Typography>
            <Chip label={data.type} size="small" />
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="subtitle1" gutterBottom>
        Étapes ({data.etapes?.length || 0})
      </Typography>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <List dense>
          {data.etapes?.map((etape, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={`${idx + 1}. ${etape.titre}`}
                  secondary={`${etape.description} (${etape.xp} XP)`}
                />
              </ListItem>
            </React.Fragment>
          ))}
          {(!data.etapes || data.etapes.length === 0) && (
            <ListItem>
              <ListItemText secondary="Aucune étape définie" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Typography variant="subtitle1" gutterBottom>
        Pré-requis ({data.prerequisObjects?.length || 0})
      </Typography>
       <Paper variant="outlined">
         <List dense>
           {data.prerequisObjects?.map((fig) => (
             <ListItem key={fig.id}>
               <ListItemText primary={fig.nom} />
             </ListItem>
           ))}
           {(!data.prerequisObjects || data.prerequisObjects.length === 0) && (
              <ListItem>
                <ListItemText secondary="Aucun pré-requis" />
              </ListItem>
           )}
         </List>
       </Paper>

    </Box>
  );
};

export default ReviewStep;
