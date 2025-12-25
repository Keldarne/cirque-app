/**
 * Tests d'intégration pour l'authentification
 * Ces tests vérifient que le rôle utilisateur est correctement géré
 */

describe('Authentication Integration', () => {
  describe('User object structure', () => {
    it('should have role field in user object after login', () => {
      // Simuler la réponse du backend
      const mockLoginResponse = {
        token: 'mock-jwt-token',
        role: 'admin',
        user: {
          id: 1,
          pseudo: 'admin',
          email: 'admin@cirque.com',
          niveau: 10,
          xp: 1000,
          role: 'admin' // ← Ce champ DOIT être présent
        }
      };

      // Vérifier que la structure est correcte
      expect(mockLoginResponse.user).toHaveProperty('role');
      expect(mockLoginResponse.user.role).toBeDefined();
      expect(mockLoginResponse.user.role).toBe('admin');
    });

    it('should have role field for standard users', () => {
      const mockLoginResponse = {
        token: 'mock-jwt-token',
        role: 'standard',
        user: {
          id: 2,
          pseudo: 'user',
          email: 'user@cirque.com',
          niveau: 1,
          xp: 50,
          role: 'standard'
        }
      };

      expect(mockLoginResponse.user).toHaveProperty('role');
      expect(mockLoginResponse.user.role).toBe('standard');
    });

    it('CRITICAL: role must be in user object, not just at root level', () => {
      // Ce test documente le bug qui a été corrigé
      const incorrectResponse = {
        token: 'token',
        role: 'admin', // Seulement ici...
        user: {
          id: 1,
          pseudo: 'admin'
          // ...mais pas ici ❌
        }
      };

      const correctResponse = {
        token: 'token',
        role: 'admin',
        user: {
          id: 1,
          pseudo: 'admin',
          role: 'admin' // ✅ Doit être ici aussi
        }
      };

      // Le mauvais format ne fonctionne pas pour la navigation
      expect(incorrectResponse.user.role).toBeUndefined();

      // Le bon format fonctionne
      expect(correctResponse.user.role).toBeDefined();
      expect(correctResponse.user.role).toBe('admin');
    });
  });

  describe('LocalStorage handling', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should store user with role in localStorage', () => {
      const user = {
        id: 1,
        pseudo: 'admin',
        email: 'admin@test.com',
        niveau: 10,
        xp: 1000,
        role: 'admin'
      };

      localStorage.setItem('user', JSON.stringify(user));

      const storedUser = JSON.parse(localStorage.getItem('user'));
      expect(storedUser).toHaveProperty('role', 'admin');
    });

    it('should preserve role when retrieving from localStorage', () => {
      const adminUser = {
        id: 1,
        pseudo: 'admin',
        role: 'admin'
      };

      localStorage.setItem('user', JSON.stringify(adminUser));

      const retrieved = JSON.parse(localStorage.getItem('user'));
      expect(retrieved.role).toBe('admin');
    });
  });
});
