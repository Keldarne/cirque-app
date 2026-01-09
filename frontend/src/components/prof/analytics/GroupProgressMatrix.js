import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Validé
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'; // Non commencé
import LoopIcon from '@mui/icons-material/Loop'; // En cours
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // Bloqué (simulé)

import api from '../../../utils/api';
import StudentAnalyticsModal from './StudentAnalyticsModal';

const STATUS_COLORS = {
  valide: 'success.main',
  en_cours: 'warning.main',
  non_commence: 'text.disabled',
  bloque: 'error.main',
  restricted: 'text.secondary'
};

const GroupProgressMatrix = ({ students, figures, selectedGroup }) => {
  const [matrixData, setMatrixData] = useState({}); // { studentId: { figureId: status } }
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Switch to list on tablets too for better UX

  useEffect(() => {
    fetchAllProgressions();
  }, [selectedGroup, students]);

  const fetchAllProgressions = async () => {
    setLoading(true);
    let data = {};
    
    try {
      // 1. Try Optimized Bulk Endpoint
      const url = selectedGroup 
        ? `/api/prof/dashboard/matrix?groupe_id=${selectedGroup}`
        : `/api/prof/dashboard/matrix`;
        
      const response = await api.get(url);
      
      if (response.ok) {
        const result = await response.json();
        setMatrixData(result.matrix || {});
        setLoading(false); // Important: stop loading before returning
        return; 
      }
    } catch (err) {
      // Ignore 404/500 here to try fallback
      console.warn("Bulk matrix endpoint unavailable, switching to fallback mode.");
    }

    // 2. Fallback: Slow individual requests (N+1)
    try {
      await Promise.all(students.map(async (student) => {
        try {
          const response = await api.get(`/api/progression/utilisateur/${student.id}`);
          
          if (response.status === 403) {
             // Restriction backend
             const restrictedProgress = {};
             figures.forEach(fig => restrictedProgress[fig.id] = 'restricted');
             data[student.id] = restrictedProgress;
             return;
          }
          
          if (!response.ok) return;

          const studentData = await response.json();
          const studentProgress = {};
          
          studentData.forEach(prog => {
            const allSteps = prog.etapes || [];
            if (allSteps.length === 0) return;

            const totalSteps = allSteps.length;
            const validSteps = allSteps.filter(s => s.statut === 'valide').length;
            const inProgressSteps = allSteps.filter(s => s.statut === 'en_cours').length;

            let status = 'non_commence';
            if (validSteps === totalSteps) status = 'valide';
            else if (validSteps > 0 || inProgressSteps > 0) status = 'en_cours';
            
            studentProgress[prog.figure_id] = status;
          });

          data[student.id] = studentProgress;
        } catch (err) {
          console.error(`Failed to fetch for student ${student.id}`, err);
          data[student.id] = {};
        }
      }));
      
      setMatrixData(data);
    } catch (err) {
      console.error("Error in fallback matrix fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valide': return <CheckCircleIcon color="success" />;
      case 'en_cours': return <LoopIcon color="warning" />;
      case 'non_commence': return <RadioButtonUncheckedIcon color="disabled" />;
      default: return <RadioButtonUncheckedIcon color="disabled" />;
    }
  };
  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setAnalyticsOpen(true);
  };

  if (loading) return <CircularProgress />;

  if (isMobile) {
    return (
      <Box>
        <List>
          {students.map((student) => {
             // Calculate progress for this student on these figures
             const studentProgress = figures.map(f => matrixData[student.id]?.[f.id] || 'non_commence');
             const validCount = studentProgress.filter(s => s === 'valide').length;
             const progressPercent = figures.length > 0 ? Math.round((validCount / figures.length) * 100) : 0;

             return (
               <ListItem key={student.id} button onClick={() => handleStudentClick(student)} divider>
                 <ListItemAvatar>
                   <Avatar sx={{ bgcolor: theme.palette.primary.main }}>{student.prenom?.[0]}</Avatar>
                 </ListItemAvatar>
                 <ListItemText 
                   primary={`${student.prenom} ${student.nom}`}
                   secondary={
                     <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                       <Box sx={{ width: '100%', mr: 1 }}>
                         <LinearProgress variant="determinate" value={progressPercent} color={progressPercent === 100 ? "success" : "primary"} />
                       </Box>
                       <Box sx={{ minWidth: 35 }}>
                         <Typography variant="body2" color="text.secondary">{`${Math.round(progressPercent)}%`}</Typography>
                       </Box>
                     </Box>
                   }
                 />
               </ListItem>
             );
          })}
        </List>
        <StudentAnalyticsModal 
          open={analyticsOpen} 
          onClose={() => setAnalyticsOpen(false)} 
          student={selectedStudent} 
          onValidation={fetchAllProgressions}
        />
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', zIndex: 10, bgcolor: 'background.paper', left: 0, position: 'sticky' }}>
                Élève
              </TableCell>
              {figures.map((fig) => (
                <TableCell 
                  key={fig.id} 
                  align="center" 
                  sx={{ 
                    minWidth: 50,
                    height: 150,
                    verticalAlign: 'bottom',
                    p: 1
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      height: '100%',
                      width: '100%'
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        maxHeight: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {fig.nom}
                    </Box>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} hover>
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{ 
                    cursor: 'pointer', 
                    fontWeight: 'medium',
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    '&:hover': { textDecoration: 'underline', color: 'primary.main' }
                  }}
                  onClick={() => handleStudentClick(student)}
                >
                  {student.prenom} {student.nom}
                </TableCell>
                {figures.map((fig) => {
                  const status = matrixData[student.id]?.[fig.id] || 'non_commence';
                  return (
                    <TableCell key={fig.id} align="center">
                      <Tooltip title={status}>
                        <Box>{getStatusIcon(status)}</Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Chip icon={<CheckCircleIcon />} label="Acquis" color="success" variant="outlined" size="small" />
        <Chip icon={<LoopIcon />} label="En cours" color="warning" variant="outlined" size="small" />
        <Chip icon={<RadioButtonUncheckedIcon />} label="Non commencé" disabled variant="outlined" size="small" />
      </Box>

      <StudentAnalyticsModal 
        open={analyticsOpen} 
        onClose={() => setAnalyticsOpen(false)} 
        student={selectedStudent}
        onValidation={fetchAllProgressions}
      />
    </Box>
  );
};

export default GroupProgressMatrix;
