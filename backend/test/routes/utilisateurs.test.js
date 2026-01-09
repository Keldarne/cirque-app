/**
 * Tests pour les routes utilisateurs (auth + profil)
 * Vérifie: registration, login, JWT, permissions
 */
const { authRequest, loginAs, waitForServer } = require('../helpers/auth-helper');

describe('👤 Utilisateurs Routes - Auth & Profil', () => {
  let eleveToken, adminToken;
  let eleveUser;

  beforeAll(async () => {
    await waitForServer();

    ({ token: eleveToken, user: eleveUser } = await loginAs.user());
    ({ token: adminToken } = await loginAs.admin());
  });

  describe('POST /api/register - Inscription', () => {
    test('✅ Crée un nouvel utilisateur', async () => {
      const timestamp = Date.now();
      const res = await authRequest.post('/register', null, {
        pseudo: `testuser_${timestamp}`,
        email: `test_${timestamp}@example.com`,
        mot_de_passe: 'Test123!',
        role: 'eleve'
      });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('utilisateur');
    });

    test('❌ Email déjà utilisé retourne 400', async () => {
      const res = await authRequest.post('/register', null, {
        pseudo: 'duplicate',
        email: 'user1@example.com',
        mot_de_passe: 'Test123!',
        role: 'eleve'
      });

      expect(res.status).toBe(400);
    });

    test('❌ Mot de passe invalide retourne 400', async () => {
      const res = await authRequest.post('/register', null, {
        pseudo: 'weakpwd',
        email: 'weak@test.com',
        mot_de_passe: '123',
        role: 'eleve'
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/login - Connexion', () => {
    test('✅ Login avec credentials valides', async () => {
      const res = await authRequest.post('/login', null, {
        email: 'user1@example.com',
        mot_de_passe: 'user123'
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('utilisateur');
    });

    test('❌ Login avec mauvais mot de passe retourne 401', async () => {
      const res = await authRequest.post('/login', null, {
        email: 'user1@example.com',
        mot_de_passe: 'wrongpassword'
      });

      expect(res.status).toBe(401);
    });

    test('❌ Login avec email inexistant retourne 401', async () => {
      const res = await authRequest.post('/login', null, {
        email: 'nonexistent@test.com',
        mot_de_passe: 'test123'
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/utilisateurs/profil - Profil utilisateur', () => {
    test('✅ Utilisateur récupère son profil', async () => {
      const res = await authRequest.get('/utilisateurs/profil', eleveToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
      expect(res.body).not.toHaveProperty('mot_de_passe');
    });

    test('❌ Sans authentification retourne 401', async () => {
      const res = await authRequest.get('/utilisateurs/profil', null);

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/utilisateurs/profil - Modification profil', () => {
    test('✅ Utilisateur peut modifier son profil', async () => {
      const res = await authRequest.put('/utilisateurs/profil', eleveToken, {
        pseudo: 'Updated Pseudo'
      });

      expect([200, 204]).toContain(res.status);
    });
  });
});
