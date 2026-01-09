const InteractionService = require('../../src/services/InteractionService');
const { InteractionProfEleve } = require('../../src/models');

jest.mock('../../src/models', () => ({
  InteractionProfEleve: {
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  }
}));

describe('InteractionService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enregistrerInteraction', () => {
    it('✅ Enregistre nouvelle interaction prof-élève', async () => {
      const mockInteraction = {
        id: 1,
        professeur_id: 1,
        eleve_id: 10,
        type: 'encouragement',
        contenu: 'Bon travail!'
      };

      InteractionProfEleve.create.mockResolvedValue(mockInteraction);

      const result = await InteractionService.enregistrerInteraction({
        professeur_id: 1,
        eleve_id: 10,
        type: 'encouragement',
        contenu: 'Bon travail!'
      });

      expect(InteractionProfEleve.create).toHaveBeenCalled();
      expect(result.type).toBe('encouragement');
    });
  });

  describe('getInteractionsByEleve', () => {
    it('✅ Récupère interactions d\'un élève', async () => {
      const mockInteractions = [
        { id: 1, type: 'encouragement', contenu: 'Bravo!' },
        { id: 2, type: 'alerte', contenu: 'Attention sécurité' }
      ];

      InteractionProfEleve.findAll.mockResolvedValue(mockInteractions);

      const result = await InteractionService.getInteractionsByEleve(10);

      expect(result).toHaveLength(2);
      expect(InteractionProfEleve.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eleve_id: 10 })
        })
      );
    });

    it('✅ Retourne vide si élève sans interactions', async () => {
      InteractionProfEleve.findAll.mockResolvedValue([]);

      const result = await InteractionService.getInteractionsByEleve(999);

      expect(result).toEqual([]);
    });
  });

  describe('countInteractionsByType', () => {
    it('✅ Compte interactions par type', async () => {
      InteractionProfEleve.count.mockResolvedValue(5);

      const result = await InteractionService.countInteractionsByType(10, 'encouragement');

      expect(result).toBe(5);
      expect(InteractionProfEleve.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eleve_id: 10,
            type: 'encouragement'
          })
        })
      );
    });
  });
});
