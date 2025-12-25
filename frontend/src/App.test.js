import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock AuthContext pour éviter les appels API pendant les tests
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  })
}));

describe('App Component', () => {
  test('renders navigation bar', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    const navElement = screen.getByText(/Cirque App/i);
    expect(navElement).toBeInTheDocument();
  });

  test('renders disciplines link in navigation', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    const disciplinesLink = screen.getByText(/Disciplines/i);
    expect(disciplinesLink).toBeInTheDocument();
  });
});
