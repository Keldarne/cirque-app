🎯 Patterns de Navigation dans l'App
Pattern 1 : Liste → Détail
ListeDisciplinesPage (/)
  └─ Clic sur discipline
      └─ FiguresPage (/discipline/:id)
          └─ Clic sur figure (si connecté)
              └─ Ajout à MonProgrammePage
Pattern 2 : Programme → Détail Figure
MonProgrammePage (/mon-programme)
  └─ Clic sur carte progression
      └─ FigureDetailPage (/progression/:progressionId)
          └─ Bouton "Retour à Mon Programme"
              └─ navigate('/mon-programme')
Pattern 3 : Protection par Auth
Utilisateur non connecté
  └─ Tente d'accéder à /profil
      └─ useEffect détecte !isAuthenticated
          └─ navigate('/auth')