import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SwipeableDrawer,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  styled
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Petite barre grise pour indiquer qu'on peut "tirer" le tiroir
const Puller = styled(Box)(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: theme.palette.grey[300],
  borderRadius: 3,
  position: 'absolute',
  top: 8,
  left: 'calc(50% - 15px)',
}));

const ResponsiveDrawer = ({ 
  open, 
  onClose, 
  title, 
  children, 
  actions,
  maxWidth = "md" 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // --- VERSION MOBILE : BOTTOM SHEET (TIROIR) ---
  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen={false}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            height: 'auto',
            maxHeight: '90vh', // Ne prend pas tout l'écran
            overflow: 'visible' // Pour le Puller
          }
        }}
      >
        <Puller />
        <Box sx={{ px: 2, py: 2, pt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ px: 2, pb: 4, overflowY: 'auto' }}>
          {children}
        </Box>

        {actions && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {actions}
          </Box>
        )}
      </SwipeableDrawer>
    );
  }

  // --- VERSION DESKTOP : MODALE CLASSIQUE ---
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ p: 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ResponsiveDrawer;
