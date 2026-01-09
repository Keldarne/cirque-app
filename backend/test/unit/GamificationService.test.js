const GamificationService = require('../../src/services/GamificationService');
const { Badge, BadgeUtilisateur, Utilisateur, ProgressionEtape } = require('../../src/models');

// Mock the models
jest.mock('../../src/models', () => ({
  Badge: {
    findAll: jest.fn()
  },
  BadgeUtilisateur: {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn()
  },
  Utilisateur: {
    findByPk: jest.fn(),
    update: jest.fn()
  },
  ProgressionEtape: {
    count: jest.fn(),
    findAll: jest.fn()
  }
}));

describe('GamificationService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifierEtAttribuerBadges', () => {
    it('✅ Attribue badge XP total si condition remplie', async () => {
      const mockUser = { id: 1, xp_total: 1000 };
      const mockBadges = [
        { id: 1, nom: 'Expert', condition_type: 'xp_total', condition_valeur: 500 }
      ];
      const mockBadgesUtilisateur = []; // Aucun badge possédé

      Utilisateur.findByPk.mockResolvedValue(mockUser);
      Badge.findAll.mockResolvedValue(mockBadges);
      BadgeUtilisateur.findAll.mockResolvedValue(mockBadgesUtilisateur);
      BadgeUtilisateur.create.mockResolvedValue({ id: 10, badge_id: 1 });

      const result = await GamificationService.verifierEtAttribuerBadges(1);

      expect(BadgeUtilisateur.create).toHaveBeenCalledWith({
        utilisateur_id: 1,
        badge_id: 1,
        date_obtention: expect.any(Date)
      });

      expect(result).toHaveLength(1);
      expect(result[0].badge_id).toBe(1);
    });

    it('❌ Ne réattribue PAS un badge déjà possédé', async () => {
      const mockUser = { id: 1, xp_total: 1000 };
      const mockBadges = [
        { id: 1, nom: 'Expert', condition_type: 'xp_total', condition_valeur: 500 }
      ];
      const mockBadgesUtilisateur = [
        { badge_id: 1 } // Badge déjà possédé
      ];

      Utilisateur.findByPk.mockResolvedValue(mockUser);
      Badge.findAll.mockResolvedValue(mockBadges);
      BadgeUtilisateur.findAll.mockResolvedValue(mockBadgesUtilisateur);

      const result = await GamificationService.verifierEtAttribuerBadges(1);

      expect(BadgeUtilisateur.create).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });

    it('✅ Badge figures_validees: compte les ProgressionEtape valides', async () => {
      const mockUser = { id: 1, xp_total: 100 };
      const mockBadges = [
        { id: 2, nom: 'Débutant', condition_type: 'figures_validees', condition_valeur: 5 }
      ];
      const mockBadgesUtilisateur = [];

      Utilisateur.findByPk.mockResolvedValue(mockUser);
      Badge.findAll.mockResolvedValue(mockBadges);
      BadgeUtilisateur.findAll.mockResolvedValue(mockBadgesUtilisateur);
      ProgressionEtape.count.mockResolvedValue(10); // 10 étapes validées
      BadgeUtilisateur.create.mockResolvedValue({ id: 11, badge_id: 2 });

      const result = await GamificationService.verifierEtAttribuerBadges(1);

      expect(ProgressionEtape.count).toHaveBeenCalledWith({
        where: { utilisateur_id: 1, statut: 'valide' }
      });

      expect(BadgeUtilisateur.create).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('calculerNiveauDepuisXP', () => {
    it('✅ XP 0 → Niveau 1', () => {
      expect(GamificationService.calculerNiveauDepuisXP(0)).toBe(1);
    });

    it('✅ XP 100 → Niveau 2', () => {
      expect(GamificationService.calculerNiveauDepuisXP(100)).toBe(2);
    });

    it('✅ XP 500 → Niveau 5-6 environ', () => {
      const niveau = GamificationService.calculerNiveauDepuisXP(500);
      expect(niveau).toBeGreaterThanOrEqual(5);
      expect(niveau).toBeLessThanOrEqual(6);
    });

    it('✅ XP 5000 → Niveau élevé', () => {
      const niveau = GamificationService.calculerNiveauDepuisXP(5000);
      expect(niveau).toBeGreaterThan(15);
    });
  });

  describe('xpRequisPourNiveau', () => {
    it('✅ Niveau 1 → 0 XP', () => {
      expect(GamificationService.xpRequisPourNiveau(1)).toBe(0);
    });

    it('✅ Niveau 2 → 100 XP', () => {
      expect(GamificationService.xpRequisPourNiveau(2)).toBe(100);
    });

    it('✅ Niveau 10 → XP croissant', () => {
      const xp = GamificationService.xpRequisPourNiveau(10);
      expect(xp).toBeGreaterThan(1000);
    });
  });

  describe('ajouterXP', () => {
    it('✅ Ajoute XP et met à jour niveau', async () => {
      const mockUser = {
        id: 1,
        xp_total: 50,
        niveau: 1,
        save: jest.fn()
      };

      Utilisateur.findByPk.mockResolvedValue(mockUser);

      const result = await GamificationService.ajouterXP(1, 150);

      expect(mockUser.xp_total).toBe(200);
      expect(mockUser.niveau).toBe(2); // Devrait level up à niveau 2 (100 XP)
      expect(mockUser.save).toHaveBeenCalled();

      expect(result).toEqual({
        xp_ajoute: 150,
        xp_total: 200,
        ancien_niveau: 1,
        nouveau_niveau: 2,
        niveau_up: true
      });
    });

    it('✅ Pas de level up si XP insuffisant', async () => {
      const mockUser = {
        id: 1,
        xp_total: 50,
        niveau: 1,
        save: jest.fn()
      };

      Utilisateur.findByPk.mockResolvedValue(mockUser);

      const result = await GamificationService.ajouterXP(1, 30);

      expect(mockUser.xp_total).toBe(80);
      expect(mockUser.niveau).toBe(1); // Pas de level up
      expect(result.niveau_up).toBe(false);
    });

    it('❌ Utilisateur non trouvé → erreur', async () => {
      Utilisateur.findByPk.mockResolvedValue(null);

      await expect(GamificationService.ajouterXP(999, 100))
        .rejects.toThrow('Utilisateur non trouvé');
    });
  });

  describe('obtenirBadgesUtilisateur', () => {
    it('✅ Retourne badges avec infos complètes', async () => {
      const mockBadgesUtilisateur = [
        {
          id: 1,
          badge_id: 1,
          date_obtention: new Date(),
          Badge: {
            id: 1,
            nom: 'Expert',
            description: 'Desc',
            icone: 'star'
          }
        }
      ];

      BadgeUtilisateur.findAll.mockResolvedValue(mockBadgesUtilisateur);

      const result = await GamificationService.obtenirBadgesUtilisateur(1);

      expect(BadgeUtilisateur.findAll).toHaveBeenCalledWith({
        where: { utilisateur_id: 1 },
        include: expect.anything(),
        order: [['date_obtention', 'DESC']]
      });

      expect(result).toHaveLength(1);
      expect(result[0].Badge.nom).toBe('Expert');
    });
  });
});
