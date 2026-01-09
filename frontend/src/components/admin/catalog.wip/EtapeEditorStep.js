import React from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Button,
  Grid,
  Card,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Component ---
const SortableEtapeItem = ({ etape, index, onChange, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: etape.id || `etape-${index}`,
    transition: {
      duration: 150, // Plus rapide (réactif)
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    marginBottom: '16px', // replaced sx mb: 2
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative'
  };

  return (
    <Card
      variant="outlined"
      ref={setNodeRef}
      style={style}
      sx={{
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        boxShadow: isDragging ? 4 : 0
      }}
    >
      <Box display="flex">
        {/* Drag Handle */}
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            bgcolor: 'action.selected',
            borderRight: 1,
            borderColor: 'divider',
            cursor: 'grab',
            touchAction: 'none' // Important for dnd-kit on touch devices
          }}
        >
          <DragIndicatorIcon color="disabled" />
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label={`Titre Étape ${index + 1}`}
                value={etape.titre}
                onChange={(e) => onChange(index, 'titre', e.target.value)}
                placeholder="Ex: Position de départ"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="XP"
                value={etape.xp}
                onChange={(e) => onChange(index, 'xp', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Description / Consignes"
                value={etape.description}
                onChange={(e) => onChange(index, 'description', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Actions */}
        <Box display="flex" flexDirection="column" justifyContent="center" p={1}>
          <Tooltip title="Supprimer">
            <IconButton color="error" onClick={() => onRemove(index)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  );
};

// --- Main Component ---
const EtapeEditorStep = ({ data, onChange }) => {
  const etapes = data.etapes || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddEtape = () => {
    const newEtape = {
      id: `new-${Date.now()}`, // Temp ID for DND
      titre: '',
      description: '',
      xp: 10,
      ordre: etapes.length + 1
    };
    onChange({ ...data, etapes: [...etapes, newEtape] });
  };

  const handleRemoveEtape = (index) => {
    const newEtapes = etapes.filter((_, i) => i !== index);
    // Re-assign order
    const reordered = newEtapes.map((e, i) => ({ ...e, ordre: i + 1 }));
    onChange({ ...data, etapes: reordered });
  };

  const handleChangeEtape = (index, field, value) => {
    const newEtapes = [...etapes];
    newEtapes[index] = { ...newEtapes[index], [field]: value };
    onChange({ ...data, etapes: newEtapes });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = etapes.findIndex((item) => (item.id || `etape-${etapes.indexOf(item)}`) === active.id);
      const newIndex = etapes.findIndex((item) => (item.id || `etape-${etapes.indexOf(item)}`) === over.id);
      
      const newEtapes = arrayMove(etapes, oldIndex, newIndex);
      
      // Update 'ordre' property
      const updatedEtapes = newEtapes.map((item, index) => ({
        ...item,
        ordre: index + 1
      }));

      onChange({ ...data, etapes: updatedEtapes });
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Étapes de Progression ({etapes.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleAddEtape}
          size="small"
        >
          Ajouter une étape
        </Button>
      </Box>

      {etapes.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
          <Typography color="textSecondary">
            Aucune étape définie. Ajoutez des étapes pour guider la progression.
          </Typography>
          <Button sx={{ mt: 2 }} onClick={handleAddEtape}>Commencer</Button>
        </Paper>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={etapes.map((e, i) => e.id || `etape-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          {etapes.map((etape, index) => (
            <SortableEtapeItem
              key={etape.id || `etape-${index}`}
              etape={etape}
              index={index}
              onChange={handleChangeEtape}
              onRemove={handleRemoveEtape}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Button at the bottom for convenience */}
      {etapes.length > 0 && (
        <Box mt={2} display="flex" justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddEtape}
          >
            Ajouter une étape suivante
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EtapeEditorStep;