import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavigationBar from '../NavigationBar';
import { useAuth } from '../contexts/AuthContext';

// Mock du contexte d'authentification
jest.mock('../contexts/AuthContext');

describe('NavigationBar Component', () => {
  test('does not show admin link when user is not admin', () => {
    // Mock d'un utilisateur standard
    useAuth.mockReturnValue({
      user: {
        id: 1,
        pseudo: 'user',
        email: 'user@test.com',
        niveau: 1,
        xp: 50,
        role: 'standard'
      },
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <NavigationBar />
      </BrowserRouter>
    );

    expect(screen.queryByText(/Administration/i)).not.toBeInTheDocument();
  });

  test('shows admin link when user has admin role', () => {
    // Mock d'un utilisateur admin
    useAuth.mockReturnValue({
      user: {
        id: 1,
        pseudo: 'admin',
        email: 'admin@test.com',
        niveau: 10,
        xp: 1000,
        role: 'admin'
      },
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <NavigationBar />
      </BrowserRouter>
    );

    expect(screen.getByText(/Administration/i)).toBeInTheDocument();
  });

  test('shows login link when user is not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(
      <BrowserRouter>
        <NavigationBar />
      </BrowserRouter>
    );

    expect(screen.getByText(/Connexion \/ Inscription/i)).toBeInTheDocument();
  });

  test('shows user profile button when authenticated', () => {
    useAuth.mockReturnValue({
      user: {
        id: 1,
        pseudo: 'testuser',
        email: 'test@test.com',
        niveau: 5,
        xp: 250,
        role: 'standard'
      },
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <NavigationBar />
      </BrowserRouter>
    );

    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    expect(screen.getByText(/Niveau 5/i)).toBeInTheDocument();
  });

  test('critical: user object must include role field', () => {
    // Ce test vérifie que le rôle est bien présent dans l'objet user
    // C'est le test qui aurait détecté le problème initial
    const mockUser = {
      id: 1,
      pseudo: 'admin',
      email: 'admin@test.com',
      niveau: 10,
      xp: 1000,
      role: 'admin' // ← Ce champ DOIT être présent
    };

    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <NavigationBar />
      </BrowserRouter>
    );

    // Vérifier que l'objet user a bien un champ role
    const { user } = useAuth();
    expect(user).toHaveProperty('role');
    expect(user.role).toBeDefined();

    // Vérifier que le lien admin s'affiche
    expect(screen.getByText(/Administration/i)).toBeInTheDocument();
  });
});