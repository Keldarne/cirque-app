const FigureService = require('../../src/services/FigureService');
const { Figure, EtapeProgression, ExerciceFigure, Discipline } = require('../../src/models');

jest.mock('../../src/models', () => ({
  Figure: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  EtapeProgression: {
    findAll: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn()
  },
  ExerciceFigure: {
    bulkCreate: jest.fn()
  },
  Discipline: jest.fn()
}));

describe('FigureService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFiguresAvecEtapes', () => {
    it('✅ Récupère figures avec leurs étapes', async () => {
      const mockFigures = [
        {
          id: 1,
          nom: 'Poirier',
          EtapeProgressions: [
            { id: 1, titre: 'Étape 1', ordre: 0 },
            { id: 2, titre: 'Étape 2', ordre: 1 }
          ]
        }
      ];

      Figure.findAll.mockResolvedValue(mockFigures);

      const result = await FigureService.getFiguresAvecEtapes();

      expect(result).toHaveLength(1);
      expect(result[0].nom).toBe('Poirier');
      expect(Figure.findAll).toHaveBeenCalled();
    });

    it('✅ Retourne tableau vide si aucune figure', async () => {
      Figure.findAll.mockResolvedValue([]);

      const result = await FigureService.getFiguresAvecEtapes();

      expect(result).toEqual([]);
    });
  });

  describe('createFigure', () => {
    it('✅ Crée une nouvelle figure avec étapes', async () => {
      const mockFigure = { id: 10, nom: 'Nouvelle Figure' };
      Figure.create.mockResolvedValue(mockFigure);
      EtapeProgression.bulkCreate.mockResolvedValue([]);

      const figureData = {
        nom: 'Nouvelle Figure',
        discipline_id: 1,
        etapes: [
          { titre: 'Étape 1', ordre: 0, xp: 10 }
        ]
      };

      const result = await FigureService.createFigure(figureData);

      expect(Figure.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
