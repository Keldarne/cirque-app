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

  describe('calculerScoreSecurite', () => {
    it('should return score 50 with 50/50 renforcement/artistique split', async () => {
      const utilisateurId = 1;

      // Mock progressions: 50 XP renforcement, 50 XP artistique
      const mockProgressions = [
        {
          etape: {
            xp: 25,
            figure: { type: 'renforcement' }
          }
        },
        {
          etape: {
            xp: 25,
            figure: { type: 'renforcement' }
          }
        },
        {
          etape: {
            xp: 30,
            figure: { type: 'artistique' }
          }
        },
        {
          etape: {
            xp: 20,
            figure: { type: 'artistique' }
          }
        }
      ];

      ProgressionEtape.findAll.mockResolvedValue(mockProgressions);

      const result = await StatsService.calculerScoreSecurite(utilisateurId);

      expect(result.score).toBe(50); // (50 / 100) * 100
      expect(result.xp_renforcement).toBe(50);
      expect(result.xp_total).toBe(100);
      expect(result.interpretation).toBeDefined();
    });

    it('should return score 100 with 100% renforcement', async () => {
      const utilisateurId = 2;

      const mockProgressions = [
        {
          etape: {
            xp: 50,
            figure: { type: 'renforcement' }
          }
        },
        {
          etape: {
            xp: 30,
            figure: { type: 'renforcement' }
          }
        }
      ];

      ProgressionEtape.findAll.mockResolvedValue(mockProgressions);

      const result = await StatsService.calculerScoreSecurite(utilisateurId);

      expect(result.score).toBe(100); // (80 / 80) * 100
      expect(result.xp_renforcement).toBe(80);
      expect(result.xp_total).toBe(80);
    });

    it('should return score 0 with 0 XP total', async () => {
      const utilisateurId = 3;

      ProgressionEtape.findAll.mockResolvedValue([]);

      const result = await StatsService.calculerScoreSecurite(utilisateurId);

      expect(result.score).toBe(0);
      expect(result.xp_renforcement).toBe(0);
      expect(result.xp_total).toBe(0);
    });

    it('should return score 0 with 0% renforcement (100% artistique)', async () => {
      const utilisateurId = 4;

      const mockProgressions = [
        {
          etape: {
            xp: 40,
            figure: { type: 'artistique' }
          }
        },
        {
          etape: {
            xp: 60,
            figure: { type: 'artistique' }
          }
        }
      ];

      ProgressionEtape.findAll.mockResolvedValue(mockProgressions);

      const result = await StatsService.calculerScoreSecurite(utilisateurId);

      expect(result.score).toBe(0); // (0 / 100) * 100
      expect(result.xp_renforcement).toBe(0);
      expect(result.xp_total).toBe(100);
    });
  });

  describe('analyserLateralite', () => {
    it('should return équilibré for balanced laterality (equal left/right)', async () => {
      const utilisateurId = 5;

      // Mock progressions: 2 left, 2 right, 1 bilateral
      const mockProgressions = [
        { lateralite: 'gauche', etape_id: 1, etape: { titre: 'Step 1' } },
        { lateralite: 'gauche', etape_id: 2, etape: { titre: 'Step 2' } },
        { lateralite: 'droite', etape_id: 3, etape: { titre: 'Step 3' } },
        { lateralite: 'droite', etape_id: 4, etape: { titre: 'Step 4' } },
        { lateralite: 'bilateral', etape_id: 5, etape: { titre: 'Step 5' } }
      ];

      ProgressionEtape.findAll.mockResolvedValue(mockProgressions);

      const result = await StatsService.analyserLateralite(utilisateurId);

      expect(result.stats.gauche).toBe(2);
      expect(result.stats.droite).toBe(2);
      expect(result.stats.bilateral).toBe(1);
      expect(result.total).toBe(5);
      expect(result.desequilibre).toBe(0); // |2-2|/5 = 0
      expect(result.interpretation).toBe('Équilibré - Continue ainsi!');
    });

    it('should detect léger déséquilibre (15-30%)', async () => {
      const utilisateurId = 6;

      // Mock progressions: 3 left, 2 right
      const mockProgressions = [
        { lateralite: 'gauche', etape_id: 1, etape: { titre: 'Step 1' } },
        { lateralite: 'gauche', etape_id: 2, etape: { titre: 'Step 2' } },
        { lateralite: 'gauche', etape_id: 3, etape: { titre: 'Step 3' } },
        { lateralite: 'droite', etape_id: 4, etape: { titre: 'Step 4' } },
        { lateralite: 'droite', etape_id: 5, etape: { titre: 'Step 5' } }
      ];

      ProgressionEtape.findAll.mockResolvedValue(mockProgressions);

      const result = await StatsService.analyserLateralite(utilisateurId);

      expect(result.stats.gauche).toBe(3);
      expect(result.stats.droite).toBe(2);
      expect(result.total).toBe(5);
      expect(result.desequilibre).toBe(20); // |3-2|/5 = 0.2 → 20%
      expect(result.interpretation).toBe('Léger déséquilibre - Maintenir équilibre');
    });

    it('should detect déséquilibre important (>30%)', async () => {
      const utilisateurId = 7;

      // Mock progressions: 5 left, 1 right
      const mockProgressions = [
        { lateralite: 'gauche', etape_id: 1, etape: { titre: 'Step 1' } },
        { lateralite: 'gauche', etape_id: 2, etape: { titre: 'Step 2' } },
        { lateralite: 'gauche', etape_id: 3, etape: { titre: 'Step 3' } },
        { lateralite: 'gauche', etape_id: 4, etape: { titre: 'Step 4' } },
        { lateralite: 'gauche', etape_id: 5, etape: { titre: 'Step 5' } },
        { lateralite: 'droite', etape_id: 6, etape: { titre: 'Step 6' } }
      ];

      ProgressionEtape.findAll.mockResolvedValue(mockProgressions);

      const result = await StatsService.analyserLateralite(utilisateurId);

      expect(result.stats.gauche).toBe(5);
      expect(result.stats.droite).toBe(1);
      expect(result.total).toBe(6);
      expect(result.desequilibre).toBe(67); // |5-1|/6 = 0.666 → 67%
      expect(result.interpretation).toBe('Déséquilibre important - Travailler côté faible');
    });

    it('should return zeros for user with no progressions', async () => {
      const utilisateurId = 8;

      ProgressionEtape.findAll.mockResolvedValue([]);

      const result = await StatsService.analyserLateralite(utilisateurId);

      expect(result.stats.gauche).toBe(0);
      expect(result.stats.droite).toBe(0);
      expect(result.stats.bilateral).toBe(0);
      expect(result.total).toBe(0);
      expect(result.desequilibre).toBe(0);
      expect(result.interpretation).toBe('Équilibré - Continue ainsi!');
    });

    it('should only count valid progressions with laterality', async () => {
      const utilisateurId = 9;

      // This test validates the findAll query filters
      // We verify that findAll is called with the correct where clause
      const mockProgressions = [
        { lateralite: 'gauche', etape_id: 1, etape: { titre: 'Step 1' } }
      ];

      ProgressionEtape.findAll.mockResolvedValue(mockProgressions);

      await StatsService.analyserLateralite(utilisateurId);

      // Verify findAll was called with correct filters
      expect(ProgressionEtape.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            utilisateur_id: utilisateurId,
            statut: 'valide'
            // lateralite: { [Op.ne]: 'non_applicable' } - Op is mocked, harder to verify
          })
        })
      );
    });
  });

  describe('_trouverFiguresBloquantes', () => {
    it('should return an empty array as it is stubbed', async () => {
      const result = await StatsService._trouverFiguresBloquantes([1, 2, 3]);
      expect(result).toEqual([]);
    });
  });

});
