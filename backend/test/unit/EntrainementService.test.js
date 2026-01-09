const EntrainementService = require('../../src/services/EntrainementService');
const { TentativeEtape, ProgressionEtape, EtapeProgression } = require('../../src/models');

// Mock the models
jest.mock('../../src/models', () => ({
  TentativeEtape: {
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  ProgressionEtape: {
    findOne: jest.fn(),
    update: jest.fn()
  },
  EtapeProgression: {
    findByPk: jest.fn()
  }
}));

describe('EntrainementService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('_validateTentativeData', () => {
    it('✅ Mode binaire: valide avec reussie boolean', () => {
      const data = { typeSaisie: 'binaire', reussie: true };
      expect(() => EntrainementService._validateTentativeData(data)).not.toThrow();
    });

    it('❌ Mode binaire: invalide sans reussie', () => {
      const data = { typeSaisie: 'binaire' };
      expect(() => EntrainementService._validateTentativeData(data))
        .toThrow('Mode binaire: reussie (boolean) requis');
    });

    it('❌ Mode binaire: invalide avec score', () => {
      const data = { typeSaisie: 'binaire', reussie: true, score: 2 };
      expect(() => EntrainementService._validateTentativeData(data))
        .toThrow('Mode binaire: score et dureeSecondes interdits');
    });

    it('✅ Mode evaluation: valide avec score 1-3', () => {
      const data = { typeSaisie: 'evaluation', score: 2 };
      expect(() => EntrainementService._validateTentativeData(data)).not.toThrow();
    });

    it('❌ Mode evaluation: invalide avec score hors range', () => {
      const data = { typeSaisie: 'evaluation', score: 4 };
      expect(() => EntrainementService._validateTentativeData(data))
        .toThrow('Mode evaluation: score doit être 1, 2 ou 3');
    });

    it('✅ Mode duree: valide avec dureeSecondes', () => {
      const data = { typeSaisie: 'duree', dureeSecondes: 120 };
      expect(() => EntrainementService._validateTentativeData(data)).not.toThrow();
    });

    it('❌ Mode duree: invalide avec dureeSecondes négative', () => {
      const data = { typeSaisie: 'duree', dureeSecondes: -10 };
      expect(() => EntrainementService._validateTentativeData(data))
        .toThrow('Mode duree: dureeSecondes doit être > 0');
    });

    it('✅ Mode evaluation_duree: valide avec score ET duree', () => {
      const data = { typeSaisie: 'evaluation_duree', score: 3, dureeSecondes: 180 };
      expect(() => EntrainementService._validateTentativeData(data)).not.toThrow();
    });

    it('❌ Mode evaluation_duree: invalide sans score', () => {
      const data = { typeSaisie: 'evaluation_duree', dureeSecondes: 180 };
      expect(() => EntrainementService._validateTentativeData(data))
        .toThrow('Mode evaluation_duree: score ET dureeSecondes requis');
    });
  });

  describe('_calculateReussie', () => {
    it('✅ Binaire: retourne reussie direct', () => {
      expect(EntrainementService._calculateReussie('binaire', true, null, null)).toBe(true);
      expect(EntrainementService._calculateReussie('binaire', false, null, null)).toBe(false);
    });

    it('✅ Evaluation: score >= 2 → reussie = true', () => {
      expect(EntrainementService._calculateReussie('evaluation', null, 2, null)).toBe(true);
      expect(EntrainementService._calculateReussie('evaluation', null, 3, null)).toBe(true);
      expect(EntrainementService._calculateReussie('evaluation', null, 1, null)).toBe(false);
    });

    it('✅ Duree: toujours reussie = true', () => {
      expect(EntrainementService._calculateReussie('duree', null, null, 60)).toBe(true);
      expect(EntrainementService._calculateReussie('duree', null, null, 1)).toBe(true);
    });

    it('✅ Evaluation_duree: score >= 2 → reussie = true', () => {
      expect(EntrainementService._calculateReussie('evaluation_duree', null, 3, 120)).toBe(true);
      expect(EntrainementService._calculateReussie('evaluation_duree', null, 1, 120)).toBe(false);
    });
  });

  describe('enregistrerTentative', () => {
    it('✅ Enregistre tentative binaire réussie', async () => {
      const mockProgression = { id: 1, statut: 'en_cours', utilisateur_id: 5 };
      ProgressionEtape.findOne.mockResolvedValue(mockProgression);
      ProgressionEtape.update.mockResolvedValue([1]);
      TentativeEtape.create.mockResolvedValue({ id: 10, reussie: true });

      const result = await EntrainementService.enregistrerTentative({
        progression_etape_id: 1,
        typeSaisie: 'binaire',
        reussie: true
      });

      expect(TentativeEtape.create).toHaveBeenCalledWith({
        progression_etape_id: 1,
        type_saisie: 'binaire',
        reussie: true,
        score: null,
        duree_secondes: null
      });

      // Vérifier que le statut est mis à jour vers 'valide'
      expect(ProgressionEtape.update).toHaveBeenCalledWith(
        { statut: 'valide', date_validation: expect.any(Date) },
        { where: { id: 1 } }
      );

      expect(result).toHaveProperty('id', 10);
    });

    it('✅ Tentative échouée ne met PAS à jour statut vers valide', async () => {
      const mockProgression = { id: 1, statut: 'en_cours', utilisateur_id: 5 };
      ProgressionEtape.findOne.mockResolvedValue(mockProgression);
      TentativeEtape.create.mockResolvedValue({ id: 11, reussie: false });

      await EntrainementService.enregistrerTentative({
        progression_etape_id: 1,
        typeSaisie: 'binaire',
        reussie: false
      });

      // Ne devrait PAS mettre à jour vers 'valide'
      expect(ProgressionEtape.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ statut: 'valide' }),
        expect.anything()
      );
    });

    it('❌ Progression non trouvée → erreur', async () => {
      ProgressionEtape.findOne.mockResolvedValue(null);

      await expect(
        EntrainementService.enregistrerTentative({
          progression_etape_id: 999,
          typeSaisie: 'binaire',
          reussie: true
        })
      ).rejects.toThrow('ProgressionEtape non trouvée');
    });
  });

  describe('obtenirHistorique', () => {
    it('✅ Retourne historique avec limite et offset', async () => {
      const mockTentatives = [
        { id: 1, type_saisie: 'binaire', reussie: true, createdAt: new Date() },
        { id: 2, type_saisie: 'evaluation', score: 2, createdAt: new Date() }
      ];

      TentativeEtape.findAll.mockResolvedValue(mockTentatives);
      TentativeEtape.count.mockResolvedValue(10);

      const result = await EntrainementService.obtenirHistorique({
        utilisateur_id: 5,
        limit: 2,
        offset: 0
      });

      expect(result).toEqual({
        tentatives: mockTentatives,
        total: 10,
        limit: 2,
        offset: 0
      });

      expect(TentativeEtape.findAll).toHaveBeenCalledWith({
        where: { '$progressionEtape.utilisateur_id$': 5 },
        include: expect.anything(),
        order: [['createdAt', 'DESC']],
        limit: 2,
        offset: 0
      });
    });

    it('✅ Applique limite max de 100', async () => {
      TentativeEtape.findAll.mockResolvedValue([]);
      TentativeEtape.count.mockResolvedValue(0);

      await EntrainementService.obtenirHistorique({
        utilisateur_id: 5,
        limit: 500 // Demande excessive
      });

      expect(TentativeEtape.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }) // Devrait être plafonné
      );
    });
  });
});
