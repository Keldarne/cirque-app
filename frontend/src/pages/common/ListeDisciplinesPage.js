import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Container
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/api";

function DisciplinesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [disciplines, setDisciplines] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    api.get("/api/disciplines")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDisciplines(data);
        } else {
          console.error("Les disciplines ne sont pas un tableau:", data);
          setDisciplines([]);
        }
      })
      .catch(err => console.error("Erreur fetch disciplines:", err));
  }, [isAuthenticated, navigate]);

  // Rendu : grille de cartes cliquables vers chaque discipline
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
        Disciplines
      </Typography>

      <Grid container spacing={3}>
        {disciplines.map(discipline => (
          <Grid item xs={12} sm={6} md={4} key={discipline.id}>
            <Link
              to={`/discipline/${discipline.id}`}
              style={{ textDecoration: "none" }}
            >
              <Card
                sx={{
                  height: '100%',
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { 
                    transform: "translateY(-4px)",
                    boxShadow: 4
                  }
                }}
              >
                {discipline.image_url && (
                  <CardMedia
                    component="img"
                    height="180"
                    image={discipline.image_url}
                    alt={discipline.nom}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h6" align="center" fontWeight="bold">
                    {discipline.nom}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default DisciplinesPage;