const DisciplineAvailabilityService = require('../../src/services/DisciplineAvailabilityService');
const { DisciplineAvailability, Discipline } = require('../../src/models');

jest.mock('../../src/models', () => ({
  DisciplineAvailability: {
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn()
  },
  Discipline: jest.fn()
}));

describe('DisciplineAvailabilityService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDisciplinesForEcole', () => {
    it('✅ Retourne disciplines disponibles pour une école', async () => {
      const mockDisciplines = [
        {
          id: 1,
          ecole_id: 5,
          discipline_id: 10,
          actif: true,
          ordre: 0,
          discipline: { id: 10, nom: 'Jonglerie' }
        },
        {
          id: 2,
          ecole_id: 5,
          discipline_id: 11,
          actif: true,
          ordre: 1,
          discipline: { id: 11, nom: 'Acrobatie' }
        }
      ];

      DisciplineAvailability.findAll.mockResolvedValue(mockDisciplines);

      const result = await DisciplineAvailabilityService.getDisciplinesForEcole(5);

      expect(result).toHaveLength(2);
      expect(result[0].discipline.nom).toBe('Jonglerie');
    });

    it('✅ Retourne seulement actives si includeInactive=false', async () => {
      const mockDisciplines = [
        { id: 1, actif: true, discipline: { nom: 'Active' } }
      ];

      DisciplineAvailability.findAll.mockResolvedValue(mockDisciplines);

      const result = await DisciplineAvailabilityService.getDisciplinesForEcole(5, false);

      expect(DisciplineAvailability.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ecole_id: 5, actif: true })
        })
      );
    });
  });

  describe('toggleDiscipline', () => {
    it('✅ Active une discipline pour une école', async () => {
      const mockRecord = {
        id: 1,
        ecole_id: 5,
        discipline_id: 10,
        actif: false,
        save: jest.fn()
      };

      DisciplineAvailability.findOrCreate.mockResolvedValue([mockRecord, false]);

      const result = await DisciplineAvailabilityService.toggleDiscipline(5, 10, true);

      expect(mockRecord.actif).toBe(true);
      expect(mockRecord.save).toHaveBeenCalled();
    });

    it('✅ Crée nouveau record si inexistant', async () => {
      const mockRecord = { id: 1, actif: true };

      DisciplineAvailability.findOrCreate.mockResolvedValue([mockRecord, true]);

      const result = await DisciplineAvailabilityService.toggleDiscipline(5, 10, true);

      expect(result.actif).toBe(true);
    });
  });

  describe('bulkUpdateDisciplines', () => {
    it('✅ Met à jour plusieurs disciplines en masse', async () => {
      const configs = [
        { discipline_id: 10, actif: true, ordre: 0 },
        { discipline_id: 11, actif: true, ordre: 1 },
        { discipline_id: 12, actif: false, ordre: 2 }
      ];

      DisciplineAvailability.upsert.mockResolvedValue([{}, true]);

      const result = await DisciplineAvailabilityService.bulkUpdateDisciplines(5, configs);

      expect(DisciplineAvailability.upsert).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });
  });

  describe('reorderDisciplines', () => {
    it('✅ Réorganise l\'ordre des disciplines', async () => {
      const orderedIds = [12, 10, 11]; // Nouvel ordre

      DisciplineAvailability.update.mockResolvedValue([1]);

      await DisciplineAvailabilityService.reorderDisciplines(5, orderedIds);

      expect(DisciplineAvailability.update).toHaveBeenCalledTimes(3);
      // Vérifier que discipline 12 → ordre 0, discipline 10 → ordre 1, etc.
      expect(DisciplineAvailability.update).toHaveBeenNthCalledWith(
        1,
        { ordre: 0 },
        { where: { ecole_id: 5, discipline_id: 12 } }
      );
    });
  });
});
