const DashboardService = require('../../src/services/DashboardService');
const { Utilisateur, ProgressionEtape, Figure, Badge, BadgeUtilisateur } = require('../../src/models');

jest.mock('../../src/models', () => ({
  Utilisateur: {
    findByPk: jest.fn()
  },
  ProgressionEtape: {
    findAll: jest.fn(),
    count: jest.fn()
  },
  Figure: {
    findAll: jest.fn()
  },
  Badge: jest.fn(),
  BadgeUtilisateur: {
    findAll: jest.fn()
  }
}));

describe('DashboardService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('✅ Retourne données dashboard complètes', async () => {
      const mockUser = { id: 1, xp_total: 500, niveau: 3 };
      Utilisateur.findByPk.mockResolvedValue(mockUser);
      ProgressionEtape.count.mockResolvedValue(10);
      BadgeUtilisateur.findAll.mockResolvedValue([]);

      const result = await DashboardService.getDashboardData(1);

      expect(result).toBeDefined();
      expect(Utilisateur.findByPk).toHaveBeenCalledWith(1);
    });

    it('❌ Utilisateur inexistant lance erreur', async () => {
      Utilisateur.findByPk.mockResolvedValue(null);

      await expect(DashboardService.getDashboardData(999))
        .rejects.toThrow();
    });
  });
});
