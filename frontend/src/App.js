// Point d'entrée du frontend : définit la structure des routes et les providers
// - AuthProvider : enveloppe l'application pour fournir le contexte d'authentification
// - NavigationBar : barre de navigation visible sur toutes les pages
// - Routes : configuration React Router des différentes pages de l'app
import { Routes, Route } from "react-router-dom";
// Pages communes
import ListeDisciplinesPage from "./pages/common/ListeDisciplinesPage";
import FiguresPage from "./pages/common/FiguresPage";
import AuthPage from "./pages/common/AuthPage";
import ProfilPage from "./pages/common/ProfilPage";
import FigureDetailPage from "./pages/common/FigureDetailPage";

// Pages élève
import MonProgrammePage from "./pages/eleve/MonProgrammePage";
import ProgrammeDetailPageEleve from "./pages/eleve/ProgrammeDetailPage";
import EntrainementPage from "./pages/eleve/EntrainementPage";
import EntrainementSession from "./pages/eleve/EntrainementSession";
import DefisPage from "./pages/eleve/DefisPage";
import StudentSuggestionsPage from "./pages/eleve/StudentSuggestionsPage";

// Pages professeur
import TeacherDashboardPage from "./pages/prof/AdvancedDashboardPage";
import MesElevesPage from "./pages/prof/MesElevesPage";
import GroupesPage from "./pages/prof/GroupesPage";
import ProgrammesPage from "./pages/prof/ProgrammesPage";
import ProgrammeDetailPageProf from "./pages/prof/ProgrammeDetailPage";

// Pages admin
import AdminPage from "./pages/admin/AdminPage";
import NavigationBar from "./NavigationBar";
import { AuthProvider } from "./contexts/AuthContext";
import { RefreshProvider } from "./contexts/RefreshContext";

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme/branding";

function App() {
  return (
    // Le provider Auth fournit `useAuth()` aux composants enfants
    <AuthProvider>
      <RefreshProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* Barre de navigation commune */}
          <NavigationBar />

          {/* Définition des routes principales */}
          <Routes>
          <Route path="/" element={<ListeDisciplinesPage />} />
          <Route path="/discipline/:id" element={<FiguresPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/mon-programme" element={<MonProgrammePage />} />
          <Route path="/mon-programme/:id" element={<ProgrammeDetailPageEleve />} />
          <Route path="/figure/:figureId" element={<FigureDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Routes Entraînement (Refactorisées pour être centrées sur les figures) */}
          <Route path="/entrainement/figure/:figureId" element={<EntrainementPage />} />
          <Route path="/entrainement/session/:figureId" element={<EntrainementSession />} />

          {/* Routes Professeur */}
          <Route path="/prof/dashboard" element={<TeacherDashboardPage />} />
          <Route path="/prof/eleves" element={<MesElevesPage />} />
          <Route path="/prof/eleves/:eleveId" element={<MesElevesPage />} />
          <Route path="/prof/groupes" element={<GroupesPage />} />
          <Route path="/prof/groupes/:groupeId" element={<GroupesPage />} />
          <Route path="/prof/programmes" element={<ProgrammesPage />} />
          <Route path="/prof/programmes/:id" element={<ProgrammeDetailPageProf />} />

          {/* Routes Gamification */}
          <Route path="/defis" element={<DefisPage />} />
          {/* <Route path="/suggestions" element={<StudentSuggestionsPage />} /> */}
        </Routes>
        </ThemeProvider>
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;