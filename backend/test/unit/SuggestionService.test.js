const SuggestionService = require('../../src/services/SuggestionService');
const {
  Figure,
  FigurePrerequis,
  ProgressionEtape,
  EtapeProgression,
  ProgrammeFigure,
  AssignationProgramme,
  GroupeEleve,
  Utilisateur
} = require('../../src/models');

// Mock the models
jest.mock('../../src/models', () => ({
  Figure: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  FigurePrerequis: {
    findAll: jest.fn()
  },
  ProgressionEtape: {
    findAll: jest.fn(),
    count: jest.fn()
  },
  EtapeProgression: {
    findAll: jest.fn(),
    count: jest.fn()
  },
  ProgrammeFigure: {
    findAll: jest.fn()
  },
  AssignationProgramme: {
    findAll: jest.fn()
  },
  GroupeEleve: {
    findAll: jest.fn()
  },
  Utilisateur: jest.fn()
}));

describe('SuggestionService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculerScorePreparation', () => {
    it('✅ Calcule score 100% si tous exercices validés', async () => {
      // Mock figure avec 2 exercices requis
      const mockFigure = {
        id: 1,
        nom: 'Poirier',
        relationsExercices: [
          { id: 1, exercice_figure_id: 10, poids: 2, est_requis: true },
          { id: 2, exercice_figure_id: 11, poids: 3, est_requis: true }
        ]
      };

      Figure.findByPk.mockResolvedValue(mockFigure);

      // Mock toutes les figures exercices sont 100% validées
      EtapeProgression.count.mockResolvedValueOnce(5); // Figure 10: 5 étapes
      ProgressionEtape.count.mockResolvedValueOnce(5); // User validé 5/5

      EtapeProgression.count.mockResolvedValueOnce(3); // Figure 11: 3 étapes
      ProgressionEtape.count.mockResolvedValueOnce(3); // User validé 3/3

      const result = await SuggestionService.calculerScorePreparation(1, 1);

      expect(result.score).toBe(100);
      expect(result.exercices_valides).toBe(2);
      expect(result.exercices_total).toBe(2);
    });

    it('✅ Calcule score 0% si aucun exercice validé', async () => {
      const mockFigure = {
        id: 1,
        nom: 'Salto',
        relationsExercices: [
          { id: 1, exercice_figure_id: 20, poids: 5, est_requis: true }
        ]
      };

      Figure.findByPk.mockResolvedValue(mockFigure);

      EtapeProgression.count.mockResolvedValue(10); // Figure 20: 10 étapes
      ProgressionEtape.count.mockResolvedValue(0); // User validé 0/10

      const result = await SuggestionService.calculerScorePreparation(1, 1);

      expect(result.score).toBe(0);
      expect(result.exercices_valides).toBe(0);
      expect(result.exercices_total).toBe(1);
    });

    it('✅ Calcule score pondéré 75%', async () => {
      const mockFigure = {
        id: 1,
        relationsExercices: [
          { id: 1, exercice_figure_id: 30, poids: 2, est_requis: true }, // Validé
          { id: 2, exercice_figure_id: 31, poids: 1, est_requis: true }, // Non validé
          { id: 3, exercice_figure_id: 32, poids: 1, est_requis: true }  // Validé
        ]
      };

      Figure.findByPk.mockResolvedValue(mockFigure);

      // Fig 30: validé 100%
      EtapeProgression.count.mockResolvedValueOnce(5);
      ProgressionEtape.count.mockResolvedValueOnce(5);

      // Fig 31: validé 0%
      EtapeProgression.count.mockResolvedValueOnce(3);
      ProgressionEtape.count.mockResolvedValueOnce(0);

      // Fig 32: validé 100%
      EtapeProgression.count.mockResolvedValueOnce(4);
      ProgressionEtape.count.mockResolvedValueOnce(4);

      const result = await SuggestionService.calculerScorePreparation(1, 1);

      // Poids total: 2 + 1 + 1 = 4
      // Score pondéré: (2 × 100% + 1 × 0% + 1 × 100%) / 4 = 75%
      expect(result.score).toBe(75);
      expect(result.exercices_valides).toBe(2);
      expect(result.exercices_total).toBe(3);
    });

    it('❌ Figure sans exercices retourne score 0', async () => {
      const mockFigure = {
        id: 1,
        nom: 'Figure Solo',
        relationsExercices: []
      };

      Figure.findByPk.mockResolvedValue(mockFigure);

      const result = await SuggestionService.calculerScorePreparation(1, 1);

      expect(result.score).toBe(0);
      expect(result.exercices_total).toBe(0);
    });

    it('❌ Figure inexistante lance erreur', async () => {
      Figure.findByPk.mockResolvedValue(null);

      await expect(SuggestionService.calculerScorePreparation(1, 999))
        .rejects.toThrow();
    });
  });

  describe('calculerSuggestionsEleve', () => {
    it('✅ Retourne suggestions filtrées par seuil 60%', async () => {
      // Mock 3 figures avec scores différents
      const mockFigures = [
        {
          id: 1,
          nom: 'Figure A',
          descriptif: 'Desc A',
          difficulty_level: 2,
          type: 'artistique',
          relationsExercices: [{ est_requis: true }]
        },
        {
          id: 2,
          nom: 'Figure B',
          descriptif: 'Desc B',
          difficulty_level: 3,
          type: 'renforcement',
          relationsExercices: [{ est_requis: true }]
        }
      ];

      Figure.findAll.mockResolvedValue(mockFigures);

      // Mock figures assignées/validées (à exclure)
      ProgrammeFigure.findAll.mockResolvedValue([]);
      AssignationProgramme.findAll.mockResolvedValue([]);
      ProgressionEtape.count.mockResolvedValue(0); // Aucune validation 100%

      // Mock calculerScorePreparation
      jest.spyOn(SuggestionService, 'calculerScorePreparation')
        .mockResolvedValueOnce({
          score: 80,
          exercices_valides: 4,
          exercices_total: 5,
          details: []
        })
        .mockResolvedValueOnce({
          score: 40, // Sous le seuil de 60%
          exercices_valides: 2,
          exercices_total: 5,
          details: []
        });

      const result = await SuggestionService.calculerSuggestionsEleve(1, 60, 5);

      expect(result).toHaveLength(1); // Seulement Figure A (80%)
      expect(result[0].figure_id).toBe(1);
      expect(result[0].score_preparation).toBe(80);
      expect(result[0].nom).toBe('Figure A');
    });

    it('✅ Trie suggestions par score décroissant', async () => {
      const mockFigures = [
        { id: 1, nom: 'Low', relationsExercices: [{ est_requis: true }] },
        { id: 2, nom: 'High', relationsExercices: [{ est_requis: true }] },
        { id: 3, nom: 'Medium', relationsExercices: [{ est_requis: true }] }
      ];

      Figure.findAll.mockResolvedValue(mockFigures);
      ProgrammeFigure.findAll.mockResolvedValue([]);
      AssignationProgramme.findAll.mockResolvedValue([]);
      ProgressionEtape.count.mockResolvedValue(0);

      jest.spyOn(SuggestionService, 'calculerScorePreparation')
        .mockResolvedValueOnce({ score: 70, exercices_valides: 3, exercices_total: 4, details: [] })
        .mockResolvedValueOnce({ score: 95, exercices_valides: 9, exercices_total: 10, details: [] })
        .mockResolvedValueOnce({ score: 80, exercices_valides: 4, exercices_total: 5, details: [] });

      const result = await SuggestionService.calculerSuggestionsEleve(1, 60, 5);

      expect(result).toHaveLength(3);
      expect(result[0].nom).toBe('High'); // 95%
      expect(result[1].nom).toBe('Medium'); // 80%
      expect(result[2].nom).toBe('Low'); // 70%
    });

    it('✅ Limite le nombre de suggestions retournées', async () => {
      const mockFigures = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        nom: `Figure ${i + 1}`,
        relationsExercices: [{ est_requis: true }]
      }));

      Figure.findAll.mockResolvedValue(mockFigures);
      ProgrammeFigure.findAll.mockResolvedValue([]);
      AssignationProgramme.findAll.mockResolvedValue([]);
      ProgressionEtape.count.mockResolvedValue(0);

      jest.spyOn(SuggestionService, 'calculerScorePreparation')
        .mockResolvedValue({ score: 90, exercices_valides: 9, exercices_total: 10, details: [] });

      const result = await SuggestionService.calculerSuggestionsEleve(1, 60, 3);

      expect(result).toHaveLength(3); // Limite à 3
    });

    it('✅ Exclut figures déjà assignées dans programmes', async () => {
      const mockFigures = [
        { id: 1, nom: 'Non Assignée', relationsExercices: [{ est_requis: true }] },
        { id: 2, nom: 'Assignée', relationsExercices: [{ est_requis: true }] }
      ];

      Figure.findAll.mockResolvedValue(mockFigures);

      // Mock figure 2 est dans un programme assigné
      AssignationProgramme.findAll.mockResolvedValue([
        {
          programme: {
            figures: [{ figure_id: 2 }]
          }
        }
      ]);
      ProgrammeFigure.findAll.mockResolvedValue([]);
      ProgressionEtape.count.mockResolvedValue(0);

      jest.spyOn(SuggestionService, 'calculerScorePreparation')
        .mockResolvedValue({ score: 90, exercices_valides: 9, exercices_total: 10, details: [] });

      const result = await SuggestionService.calculerSuggestionsEleve(1, 60, 5);

      expect(result).toHaveLength(1);
      expect(result[0].figure_id).toBe(1); // Seulement la non-assignée
    });

    it('✅ Retourne tableau vide si aucune figure avec exercices', async () => {
      Figure.findAll.mockResolvedValue([]);

      const result = await SuggestionService.calculerSuggestionsEleve(1, 60, 5);

      expect(result).toEqual([]);
    });
  });

  describe('calculerSuggestionsGroupe', () => {
    it('✅ Calcule suggestions agrégées pour groupe', async () => {
      // Mock 2 élèves dans le groupe
      const mockGroupeEleves = [
        { eleve: { id: 1, pseudo: 'Alice' } },
        { eleve: { id: 2, pseudo: 'Bob' } }
      ];

      GroupeEleve.findAll.mockResolvedValue(mockGroupeEleves);

      // Mock suggestions individuelles
      jest.spyOn(SuggestionService, 'calculerSuggestionsEleve')
        .mockResolvedValueOnce([
          { figure_id: 10, nom: 'Roue', score_preparation: 85 },
          { figure_id: 11, nom: 'ATR', score_preparation: 90 }
        ])
        .mockResolvedValueOnce([
          { figure_id: 10, nom: 'Roue', score_preparation: 82 } // Seulement Roue pour Bob
        ]);

      const result = await SuggestionService.calculerSuggestionsGroupe(1, 50, 5);

      // Roue: 2/2 élèves prêts = 100%
      // ATR: 1/2 élèves prêts = 50%
      expect(result).toHaveLength(2);

      const roue = result.find(s => s.figure_id === 10);
      expect(roue.nb_eleves_prets).toBe(2);
      expect(roue.pourcentage_groupe_pret).toBe(100);

      const atr = result.find(s => s.figure_id === 11);
      expect(atr.nb_eleves_prets).toBe(1);
      expect(atr.pourcentage_groupe_pret).toBe(50);
    });

    it('✅ Filtre suggestions par seuil minimum groupe', async () => {
      const mockGroupeEleves = [
        { eleve: { id: 1, pseudo: 'Alice' } },
        { eleve: { id: 2, pseudo: 'Bob' } },
        { eleve: { id: 3, pseudo: 'Charlie' } },
        { eleve: { id: 4, pseudo: 'David' } }
      ];

      GroupeEleve.findAll.mockResolvedValue(mockGroupeEleves);

      jest.spyOn(SuggestionService, 'calculerSuggestionsEleve')
        .mockResolvedValue([
          { figure_id: 20, nom: 'Figure Rare', score_preparation: 85 }
        ])
        .mockResolvedValueOnce([]) // Bob pas prêt
        .mockResolvedValueOnce([]) // Charlie pas prêt
        .mockResolvedValue([
          { figure_id: 20, nom: 'Figure Rare', score_preparation: 85 }
        ]); // David prêt

      // 2/4 élèves prêts = 50% → devrait passer seuil 50%
      const result = await SuggestionService.calculerSuggestionsGroupe(1, 50, 5);

      expect(result).toHaveLength(1);
      expect(result[0].pourcentage_groupe_pret).toBe(50);

      // Avec seuil 75%, devrait être filtré
      const resultStrict = await SuggestionService.calculerSuggestionsGroupe(1, 75, 5);

      expect(resultStrict).toHaveLength(0);
    });

    it('✅ Retourne vide si groupe sans élèves', async () => {
      GroupeEleve.findAll.mockResolvedValue([]);

      const result = await SuggestionService.calculerSuggestionsGroupe(1, 50, 5);

      expect(result).toEqual([]);
    });

    it('✅ Trie suggestions par % groupe décroissant', async () => {
      const mockGroupeEleves = [
        { eleve: { id: 1, pseudo: 'E1' } },
        { eleve: { id: 2, pseudo: 'E2' } }
      ];

      GroupeEleve.findAll.mockResolvedValue(mockGroupeEleves);

      jest.spyOn(SuggestionService, 'calculerSuggestionsEleve')
        .mockResolvedValueOnce([
          { figure_id: 1, nom: 'FigA', score_preparation: 85 },
          { figure_id: 2, nom: 'FigB', score_preparation: 82 }
        ])
        .mockResolvedValueOnce([
          { figure_id: 2, nom: 'FigB', score_preparation: 90 } // Seulement FigB pour E2
        ]);

      const result = await SuggestionService.calculerSuggestionsGroupe(1, 50, 5);

      expect(result).toHaveLength(2);
      expect(result[0].figure_id).toBe(2); // FigB: 100% du groupe
      expect(result[0].pourcentage_groupe_pret).toBe(100);
      expect(result[1].figure_id).toBe(1); // FigA: 50% du groupe
      expect(result[1].pourcentage_groupe_pret).toBe(50);
    });
  });
});
