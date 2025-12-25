import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid
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
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Disciplines
      </Typography>

      <Grid container spacing={2}>
        {disciplines.map(discipline => (
          <Grid item xs={12} sm={6} md={4} key={discipline.id}>
            <Link
              to={`/discipline/${discipline.id}`}
              style={{ textDecoration: "none" }}
            >
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.05)" }
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
                <CardContent>
                  <Typography variant="h6" align="center">
                    {discipline.nom}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default DisciplinesPage;