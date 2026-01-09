const MemoryDecayService = require('../../src/services/MemoryDecayService');
const { ProgressionEtape } = require('../../src/models');

// Mock the models
jest.mock('../../src/models', () => ({
  ProgressionEtape: {
    findAll: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  }
}));

describe('MemoryDecayService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculerDecayLevel', () => {
    const baseDate = new Date('2026-01-09');  // Date de référence

    beforeEach(() => {
      // Mock Date.now() pour contrôler le temps
      jest.spyOn(Date, 'now').mockImplementation(() => baseDate.getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('✅ Fresh: 0-14 jours → decay_level = fresh', () => {
      // Validé il y a 7 jours
      const dateValidation = new Date('2026-01-02');
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('fresh');
    });

    test('✅ Fresh: 14 jours exactement → decay_level = fresh', () => {
      const dateValidation = new Date('2025-12-26');  // Il y a 14 jours
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('fresh');
    });

    test('✅ Fragile: 15-30 jours → decay_level = fragile', () => {
      const dateValidation = new Date('2025-12-20');  // Il y a 20 jours
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('fragile');
    });

    test('✅ Fragile: 30 jours exactement → decay_level = fragile', () => {
      const dateValidation = new Date('2025-12-10');  // Il y a 30 jours
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('fragile');
    });

    test('✅ Stale: 31-60 jours → decay_level = stale', () => {
      const dateValidation = new Date('2025-11-25');  // Il y a 45 jours
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('stale');
    });

    test('✅ Stale: 60 jours exactement → decay_level = stale', () => {
      const dateValidation = new Date('2025-11-10');  // Il y a 60 jours
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('stale');
    });

    test('✅ Forgotten: 61+ jours → decay_level = forgotten', () => {
      const dateValidation = new Date('2025-10-01');  // Il y a 100 jours
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('forgotten');
    });

    test('✅ Forgotten: 61 jours exactement → decay_level = forgotten', () => {
      const dateValidation = new Date('2025-11-09');  // Il y a 61 jours
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('forgotten');
    });

    test('✅ Date future → fresh (cas limite)', () => {
      const dateValidation = new Date('2026-01-20');  // Dans le futur
      const result = MemoryDecayService.calculerDecayLevel(dateValidation);

      expect(result).toBe('fresh');
    });

    test('✅ Null date → forgotten', () => {
      const result = MemoryDecayService.calculerDecayLevel(null);

      expect(result).toBe('forgotten');
    });

    test('✅ Invalid date → forgotten', () => {
      const result = MemoryDecayService.calculerDecayLevel(new Date('invalid'));

      expect(result).toBe('forgotten');
    });
  });

  describe('updateAllDecayLevels', () => {
    const baseDate = new Date('2026-01-09');

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockImplementation(() => baseDate.getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('✅ Met à jour toutes les progressions validées', async () => {
      // Mock count for total progressions
      ProgressionEtape.count.mockResolvedValue(4);

      // Mock sequelize query result [affectedRows]
      const sequelize = require('../../db');
      jest.spyOn(sequelize, 'query').mockResolvedValue([4]);

      const result = await MemoryDecayService.updateAllDecayLevels();

      // Vérifier que count a été appelé
      expect(ProgressionEtape.count).toHaveBeenCalledWith({
        where: { statut: 'valide' }
      });

      // Vérifier que query SQL a été appelée
      expect(sequelize.query).toHaveBeenCalled();

      // Vérifier le résultat
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('updated');
      expect(result.total).toBe(4);
      expect(result.updated).toBe(4);
    });

    test('✅ Ne met à jour que si decay_level change', async () => {
      ProgressionEtape.count.mockResolvedValue(2);

      const sequelize = require('../../db');
      jest.spyOn(sequelize, 'query').mockResolvedValue([0]);  // 0 rows updated

      const result = await MemoryDecayService.updateAllDecayLevels();

      // Vérifier le résultat - SQL UPDATE peut retourner 0 si aucun changement
      expect(result.updated).toBe(0);
    });

    test('✅ Gère liste vide', async () => {
      ProgressionEtape.count.mockResolvedValue(0);

      const sequelize = require('../../db');
      jest.spyOn(sequelize, 'query').mockResolvedValue([0]);

      const result = await MemoryDecayService.updateAllDecayLevels();

      expect(result.total).toBe(0);
      expect(result.updated).toBe(0);
    });

    test('❌ Gère les erreurs de base de données', async () => {
      ProgressionEtape.count.mockRejectedValue(new Error('DB Error'));

      await expect(MemoryDecayService.updateAllDecayLevels())
        .rejects
        .toThrow('DB Error');
    });
  });

  describe('getStatsDecay', () => {
    test('✅ Retourne statistiques de decay', async () => {
      const mockProgressions = [
        { decay_level: 'fresh' },
        { decay_level: 'fresh' },
        { decay_level: 'fragile' },
        { decay_level: 'stale' },
        { decay_level: 'forgotten' },
        { decay_level: 'forgotten' },
        { decay_level: 'forgotten' }
      ];

      ProgressionEtape.findAll.mockResolvedValue(mockProgressions);

      const result = await MemoryDecayService.getStatsDecay(1);

      expect(result).toEqual({
        fresh: 2,
        fragile: 1,
        stale: 1,
        forgotten: 3,
        total: 7,
        pourcentage_fresh: expect.closeTo(28.57, 1),
        pourcentage_fragile: expect.closeTo(14.29, 1),
        pourcentage_stale: expect.closeTo(14.29, 1),
        pourcentage_forgotten: expect.closeTo(42.86, 1)
      });
    });

    test('✅ Utilisateur sans progressions retourne zéros', async () => {
      ProgressionEtape.findAll.mockResolvedValue([]);

      const result = await MemoryDecayService.getStatsDecay(999);

      expect(result.total).toBe(0);
      expect(result.fresh).toBe(0);
    });
  });
});
