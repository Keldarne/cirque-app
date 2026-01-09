const GroupeProgrammeService = require('../../src/services/GroupeProgrammeService');
const { GroupeProgramme, AssignationProgramme, GroupeEleve } = require('../../src/models');

jest.mock('../../src/models', () => ({
  GroupeProgramme: {
    create: jest.fn(),
    findAll: jest.fn()
  },
  AssignationProgramme: {
    bulkCreate: jest.fn()
  },
  GroupeEleve: {
    findAll: jest.fn()
  }
}));

describe('GroupeProgrammeService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assignerProgrammeAuGroupe', () => {
    it('✅ Assigne programme à tous les élèves d\'un groupe', async () => {
      const mockGroupeEleves = [
        { eleve_id: 10 },
        { eleve_id: 11 },
        { eleve_id: 12 }
      ];

      GroupeEleve.findAll.mockResolvedValue(mockGroupeEleves);
      GroupeProgramme.create.mockResolvedValue({
        id: 1,
        groupe_id: 5,
        programme_id: 20
      });
      AssignationProgramme.bulkCreate.mockResolvedValue([]);

      const result = await GroupeProgrammeService.assignerProgrammeAuGroupe(20, 5);

      expect(GroupeEleve.findAll).toHaveBeenCalledWith({
        where: { groupe_id: 5 }
      });
      expect(AssignationProgramme.bulkCreate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('✅ Retourne résultat vide si groupe sans élèves', async () => {
      GroupeEleve.findAll.mockResolvedValue([]);

      const result = await GroupeProgrammeService.assignerProgrammeAuGroupe(20, 999);

      expect(AssignationProgramme.bulkCreate).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getProgrammesGroupe', () => {
    it('✅ Récupère programmes assignés à un groupe', async () => {
      const mockProgrammes = [
        { id: 1, programme_id: 10, groupe_id: 5 },
        { id: 2, programme_id: 11, groupe_id: 5 }
      ];

      GroupeProgramme.findAll.mockResolvedValue(mockProgrammes);

      const result = await GroupeProgrammeService.getProgrammesGroupe(5);

      expect(result).toHaveLength(2);
      expect(GroupeProgramme.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupe_id: 5 }
        })
      );
    });

    it('✅ Retourne vide si groupe sans programmes', async () => {
      GroupeProgramme.findAll.mockResolvedValue([]);

      const result = await GroupeProgrammeService.getProgrammesGroupe(999);

      expect(result).toEqual([]);
    });
  });
});
