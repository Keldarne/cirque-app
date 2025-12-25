const StatsService = require('../../src/services/StatsService');
const { Discipline, EtapeProgression, ProgressionEtape, Figure, Op } = require('../../src/models');

// Mock the models
jest.mock('../../src/models', () => ({
  Discipline: {
    findAll: jest.fn()
  },
  EtapeProgression: {
    count: jest.fn()
  },
  ProgressionEtape: {
    count: jest.fn(),
    findAll: jest.fn().mockResolvedValue([])
  },
  Figure: {
    findAll: jest.fn().mockResolvedValue([])
  },
  Op: {
    in: Symbol('in')
  }
}));

describe('StatsService - Unit Tests (Refactored)', () => {

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('calculerRadarPolyvalence', () => {
    it('should calculate completion percentage based on validated steps', async () => {
      const mockDisciplines = [
        { id: 1, nom: 'Jonglage' },
        { id: 2, nom: 'Acrobatie' },
      ];
      const utilisateurId = 1;

      // Setup mocks
      Discipline.findAll.mockResolvedValue(mockDisciplines);

      // Mock counts for "Jonglage"
      EtapeProgression.count.mockResolvedValueOnce(100); // Total steps in Jonglage
      ProgressionEtape.count.mockResolvedValueOnce(50);  // Validated steps by user in Jonglage

      // Mock counts for "Acrobatie"
      EtapeProgression.count.mockResolvedValueOnce(80); // Total steps in Acrobatie
      ProgressionEtape.count.mockResolvedValueOnce(20); // Validated steps by user in Acrobatie

      const radar = await StatsService.calculerRadarPolyvalence(utilisateurId);

      // Assertions
      expect(radar).toHaveLength(2);

      expect(radar[0].discipline).toBe('Jonglage');
      expect(radar[0].completion).toBe(50); // 50/100
      expect(radar[0].etapes_validees).toBe(50);
      expect(radar[0].etapes_totales).toBe(100);

      expect(radar[1].discipline).toBe('Acrobatie');
      expect(radar[1].completion).toBe(25); // 20/80
      expect(radar[1].etapes_validees).toBe(20);
      expect(radar[1].etapes_totales).toBe(80);

      // Verify mocks were called correctly
      expect(EtapeProgression.count).toHaveBeenCalledTimes(2);
      expect(ProgressionEtape.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('_trouverFiguresBloquantes', () => {
    it('should return an empty array as it is stubbed', async () => {
      const result = await StatsService._trouverFiguresBloquantes([1, 2, 3]);
      expect(result).toEqual([]);
    });
  });

});
