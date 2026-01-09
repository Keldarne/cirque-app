const ProgrammeService = require('../../src/services/ProgrammeService');
const { Programme, ProgrammeFigure, AssignationProgramme, Figure } = require('../../src/models');

jest.mock('../../src/models', () => ({
  Programme: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  ProgrammeFigure: {
    bulkCreate: jest.fn(),
    destroy: jest.fn()
  },
  AssignationProgramme: {
    create: jest.fn(),
    findAll: jest.fn()
  },
  Figure: jest.fn()
}));

describe('ProgrammeService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProgramme', () => {
    it('✅ Crée un nouveau programme avec figures', async () => {
      const mockProgramme = { id: 1, nom: 'Programme Test' };
      Programme.create.mockResolvedValue(mockProgramme);
      ProgrammeFigure.bulkCreate.mockResolvedValue([]);

      const programmeData = {
        nom: 'Programme Test',
        professeur_id: 1,
        figures: [{ figure_id: 10, ordre: 0 }]
      };

      const result = await ProgrammeService.createProgramme(programmeData);

      expect(Programme.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getProgrammesByProfId', () => {
    it('✅ Récupère programmes d\'un prof', async () => {
      const mockProgrammes = [
        { id: 1, nom: 'Prog 1', professeur_id: 1 },
        { id: 2, nom: 'Prog 2', professeur_id: 1 }
      ];

      Programme.findAll.mockResolvedValue(mockProgrammes);

      const result = await ProgrammeService.getProgrammesByProfId(1);

      expect(result).toHaveLength(2);
    });

    it('✅ Retourne vide si prof sans programmes', async () => {
      Programme.findAll.mockResolvedValue([]);

      const result = await ProgrammeService.getProgrammesByProfId(999);

      expect(result).toEqual([]);
    });
  });

  describe('assignerProgramme', () => {
    it('✅ Assigne programme à un élève', async () => {
      AssignationProgramme.create.mockResolvedValue({
        id: 1,
        programme_id: 5,
        eleve_id: 10
      });

      const result = await ProgrammeService.assignerProgramme(5, 10);

      expect(AssignationProgramme.create).toHaveBeenCalled();
      expect(result.eleve_id).toBe(10);
    });
  });
});
