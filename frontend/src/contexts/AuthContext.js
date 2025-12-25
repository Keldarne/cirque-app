import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';

const AuthContext = createContext();

// Hook personnalisé pour accéder au contexte d'authentification
// Utiliser `const { user, login, logout } = useAuth()` dans les composants
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider d'authentification
// Gère :
// - stockage local du token et des infos utilisateur (localStorage)
// - fonctions login/register/logout
// - helper updateUser pour synchroniser les changements d'XP/niveau
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        // Si les données sont corrompues, on les supprime
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Synchroniser le user avec localStorage quand il change
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // Fonction de connexion
  const login = async (pseudoOrEmail, motDePasse) => {
    try {
      // Détecter si l'entrée est un email ou un pseudo
      const isEmail = pseudoOrEmail.includes('@');

      const response = await fetch('/api/utilisateurs/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isEmail ? { email: pseudoOrEmail } : { pseudo: pseudoOrEmail }),
          mot_de_passe: motDePasse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Sauvegarder le token et les infos utilisateur
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Fonction d'inscription (enregistre puis connecte l'utilisateur)
  const register = async (pseudo, email, motDePasse) => {
    try {
      const response = await fetch('/api/utilisateurs/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pseudo,
          email,
          mot_de_passe: motDePasse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Après l'inscription, connecter automatiquement l'utilisateur
      return await login(pseudo, motDePasse);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Déconnexion : supprime les données locales et remet l'état à null
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Fonction pour mettre à jour les données utilisateur (utile après gain d'XP)
  const updateUser = (userData) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // Fonction pour rafraîchir les données utilisateur depuis le serveur
  // (placeholder — implémenter une route GET /utilisateurs/:id côté backend si nécessaire)
  const refreshUser = async () => {
    if (!user || !token) return;

    try {
      const response = await fetchWithAuth('/api/utilisateurs/me');
      if (response.ok) {
        const updatedUserData = await response.json();
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      } else {
        // Si le token est expiré ou invalide, déconnecter l'utilisateur
        console.error('Erreur rafraîchissement, déconnexion probable');
        logout();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    setUser,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
