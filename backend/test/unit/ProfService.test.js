const ProfService = require('../../src/services/ProfService');
const { Utilisateur, Groupe, GroupeEleve, Streak, ProgressionEtape } = require('../../src/models');

jest.mock('../../src/models', () => ({
  Utilisateur: {
    findByPk: jest.fn(),
    findAll: jest.fn()
  },
  Groupe: jest.fn(),
  GroupeEleve: jest.fn(),
  Streak: jest.fn(),
  ProgressionEtape: {
    findAll: jest.fn(),
    count: jest.fn()
  },
  Op: {
    in: Symbol('in')
  }
}));

describe('ProfService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getElevesByEcole', () => {
    it('✅ Retourne élèves de la même école que le prof', async () => {
      const mockProf = { id: 1, ecole_id: 5 };
      const mockEleves = [
        {
          id: 10,
          nom: 'Martin',
          prenom: 'Alice',
          ecole_id: 5,
          role: 'eleve',
          GroupeEleves: [],
          toJSON() { return { ...this }; }
        }
      ];

      Utilisateur.findByPk.mockResolvedValue(mockProf);
      Utilisateur.findAll.mockResolvedValue(mockEleves);

      const result = await ProfService.getElevesByEcole(1);

      expect(result).toHaveLength(1);
      expect(result[0].nom).toBe('Martin');
    });

    it('✅ Retourne vide si prof sans école', async () => {
      const mockProf = { id: 1, ecole_id: null };
      Utilisateur.findByPk.mockResolvedValue(mockProf);

      const result = await ProfService.getElevesByEcole(1);

      expect(result).toEqual([]);
    });

    it('✅ Retourne vide si prof inexistant', async () => {
      Utilisateur.findByPk.mockResolvedValue(null);

      const result = await ProfService.getElevesByEcole(999);

      expect(result).toEqual([]);
    });
  });

  describe('getStatistiquesEleve', () => {
    it('✅ Calcule statistiques complètes pour un élève', async () => {
      ProgressionEtape.findAll.mockResolvedValue([
        { statut: 'valide' },
        { statut: 'valide' }
      ]);
      ProgressionEtape.count.mockResolvedValue(2);

      const result = await ProfService.getStatistiquesEleve(10);

      expect(result).toBeDefined();
    });
  });
});
