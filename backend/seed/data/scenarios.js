module.exports = {
  at_risk: {
    totalValidations: 17,
    distribution: { days_8_to_30: 15, last_7_days: 2 },
    targetRatio: 0.35
  },
  stable: {
    totalValidations: 44,
    distribution: { days_8_to_30: 33, last_7_days: 11 },
    targetRatio: 1.0
  },
  progressing: {
    totalValidations: 52,
    distribution: { days_8_to_30: 32, last_7_days: 20 },
    targetRatio: 1.87
  },
  specialist_juggling: {
    disciplines: { 'Balles': 0.85, 'Massues': 0.75, 'Anneaux': 0.10 }
  },
  specialist_aerial: {
    disciplines: { 'Tissu': 0.90, 'Cerceau Aérien': 0.80, 'Trapèze': 0.15 }
  },
  balanced: {
    disciplines: {
      'Balles': 0.45, 'Tissu': 0.40, 'Acrobatie': 0.50,
      'Equilibre': 0.35, 'Diabolo': 0.40, 'Cerceau Aérien': 0.30,
      'Trapèze': 0.35, 'Pyramide': 0.45
    }
  },
  low_safety: {
    renforcementRatio: 0.05,
    totalProgressions: 20,
    renforcementCount: 1
  }
};
