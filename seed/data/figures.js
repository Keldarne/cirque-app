module.exports = [
  // Renforcement (15 figures)
  {
    nom: 'Gainage planche 30s',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 1,
    descriptif: 'Exercice de gainage de base pour renforcer la sangle abdominale et stabiliser le tronc. Essentiel pour la pratique du cirque.',
    steps: ['Position de planche', 'Tenir 30 secondes', 'Respiration contrôlée']
  },
  {
    nom: 'Gainage planche 1min',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 2,
    descriptif: 'Progression du gainage avec tenue prolongée. Développe l\'endurance musculaire et la résistance mentale.',
    steps: ['Position de planche', 'Tenir 1 minute', 'Respiration contrôlée']
  },
  {
    nom: 'Pompes 10 répétitions',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 1,
    descriptif: 'Exercice fondamental pour développer la force des bras, épaules et pectoraux. Base pour les portés et les figures aériennes.',
    steps: ['Position haute', 'Descente contrôlée', '10 répétitions complètes']
  },
  {
    nom: 'Pompes 20 répétitions',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 3,
    descriptif: 'Version avancée des pompes pour un renforcement musculaire complet du haut du corps.',
    steps: ['Position haute', 'Descente contrôlée', '20 répétitions complètes']
  },
  {
    nom: 'Squats 15 répétitions',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 1,
    descriptif: 'Renforcement des jambes et du bas du corps. Crucial pour les réceptions, les sauts et la stabilité générale.',
    steps: ['Position debout', 'Descente genoux 90°', '15 répétitions']
  },
  {
    nom: 'Squats 30 répétitions',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 2,
    descriptif: 'Progression pour développer force et endurance des membres inférieurs. Améliore l\'explosivité.',
    steps: ['Position debout', 'Descente genoux 90°', '30 répétitions']
  },
  {
    nom: 'Étirements jambes 5min',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 1,
    descriptif: 'Séance de souplesse pour améliorer l\'amplitude articulaire et prévenir les blessures. Indispensable pour l\'acrobatie.',
    steps: ['Grand écart facial', 'Étirement ischio', 'Tenue 5 minutes']
  },
  {
    nom: 'Souplesse grand écart',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 3,
    descriptif: 'Travail approfondi de la souplesse pour atteindre le grand écart complet. Permet d\'exécuter des figures spectaculaires.',
    steps: ['Échauffement', 'Progression grand écart', 'Tenue 30 secondes']
  },
  {
    nom: 'Abdos crunch 20 reps',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 2,
    descriptif: 'Renforcement ciblé des abdominaux pour un meilleur contrôle du corps et une protection lombaire optimale.',
    steps: ['Position allongée', 'Relevé buste', '20 répétitions']
  },
  {
    nom: 'Mobilité épaules',
    discipline: 'Tissu',
    type: 'renforcement',
    difficulty_level: 2,
    descriptif: 'Exercices pour améliorer l\'amplitude et la santé des épaules. Prévient les blessures en tissu et aérien.',
    steps: ['Rotations épaules', 'Étirement capsule', 'Amplitude complète']
  },
  {
    nom: 'Cardio 10min',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 2,
    descriptif: 'Travail cardiovasculaire pour améliorer l\'endurance générale et la récupération entre les figures.',
    steps: ['Échauffement cardio', 'Course/vélo 10min', 'Retour au calme']
  },
  {
    nom: 'Force grip 2min',
    discipline: 'Trapèze',
    type: 'renforcement',
    difficulty_level: 3,
    descriptif: 'Exercice de suspension pour développer la force de préhension, essentielle pour toutes les disciplines aériennes.',
    steps: ['Suspension barre', 'Tenue 2 minutes', 'Force des mains']
  },
  {
    nom: 'Équilibre gainage',
    discipline: 'Equilibre',
    type: 'renforcement',
    difficulty_level: 3,
    descriptif: 'Combinaison d\'équilibre et de gainage pour améliorer la proprioception et le contrôle corporel.',
    steps: ['Planche sur boule', 'Gainage actif', 'Tenue 1 minute']
  },
  {
    nom: 'Endurance bras',
    discipline: 'Cerceau Aérien',
    type: 'renforcement',
    difficulty_level: 4,
    descriptif: 'Exercice intensif pour développer l\'endurance musculaire des bras, nécessaire pour les longues sessions aériennes.',
    steps: ['Suspension cerceau', 'Montées répétées', '5 montées']
  },
  {
    nom: 'Renforcement dos',
    discipline: 'Acrobatie',
    type: 'renforcement',
    difficulty_level: 2,
    descriptif: 'Renforcement de la chaîne postérieure pour une meilleure posture et protection contre les blessures dorsales.',
    steps: ['Superman au sol', 'Relevés dos', '15 répétitions']
  },

  // Balles (6 figures artistiques)
  {
    nom: 'Jonglage 3 balles cascade',
    discipline: 'Balles',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Figure de base du jonglage à 3 balles. Pattern fondamental qui développe la coordination bilatérale et le rythme.',
    lateralite_requise: 'bilateral',  // Les deux mains doivent jongler
    steps: ['Lancer main droite', 'Lancer main gauche', 'Rythme régulier', '10 cycles']
  },
  {
    nom: 'Jonglage 3 balles fontaine',
    discipline: 'Balles',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Pattern circulaire élégant où les balles suivent des trajectoires parallèles. Développe la précision et le contrôle.',
    steps: ['Pattern circulaire', 'Hauteur identique', '5 cycles']
  },
  {
    nom: 'Jonglage 3 balles shower',
    discipline: 'Balles',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Figure avancée où les balles tournent en circuit continu. Nécessite une excellente coordination main droite/gauche.',
    steps: ['Circuit main droite-gauche', 'Lancer haut', '3 cycles']
  },
  {
    nom: 'Jonglage 4 balles',
    discipline: 'Balles',
    type: 'artistique',
    difficulty_level: 5,
    descriptif: 'Jonglage à 4 balles avec pattern en fontaine. Challenge technique majeur qui améliore vitesse et précision.',
    steps: ['Lancer simultané', 'Rythme soutenu', '5 cycles']
  },
  {
    nom: 'Jonglage 3 balles tricks',
    discipline: 'Balles',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Variantes créatives de la cascade : sous la jambe, derrière le dos. Apporte spectacle et originalité.',
    steps: ['Under the leg', 'Behind the back', 'Reprise cascade']
  },
  {
    nom: 'Jonglage 3 balles rebond',
    discipline: 'Balles',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Jonglage avec rebond au sol. Style unique qui demande un timing précis et une bonne lecture du rebond.',
    steps: ['Rebond au sol', 'Rythme cascade', '10 cycles']
  },

  // Massues (4 figures artistiques)
  {
    nom: 'Jonglage 3 massues cascade',
    discipline: 'Massues',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Jonglage classique à 3 massues. Nécessite force et dextérité pour gérer le poids et les rotations des massues.',
    steps: ['Prise massues', 'Rotations contrôlées', '10 cycles']
  },
  {
    nom: 'Jonglage 3 massues doubles',
    discipline: 'Massues',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Lancers avec double rotation des massues. Figure spectaculaire qui requiert précision et puissance.',
    steps: ['Lancer double rotation', 'Réception', '3 cycles']
  },
  {
    nom: 'Jonglage 3 massues passing',
    discipline: 'Massues',
    type: 'artistique',
    difficulty_level: 5,
    descriptif: 'Jonglage à deux jongleurs avec échange de massues. Développe communication, timing et travail d\'équipe.',
    steps: ['Synchronisation partenaire', 'Échange massues', '5 passes']
  },
  {
    nom: 'Jonglage 3 massues tricks',
    discipline: 'Massues',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Variations spectaculaires de la cascade de massues. Combine technique et créativité pour impressionner le public.',
    steps: ['Under the leg', 'Behind', 'Reprise']
  },

  // Anneaux (3 figures artistiques)
  {
    nom: 'Jonglage 3 anneaux cascade',
    discipline: 'Anneaux',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Jonglage fluide avec des anneaux légers. Les lancers plats créent un effet visuel unique et élégant.',
    steps: ['Lancer plat', 'Réception douce', '10 cycles']
  },
  {
    nom: 'Jonglage 4 anneaux',
    discipline: 'Anneaux',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Figure avancée à 4 anneaux. Pattern synchronisé qui demande vitesse, rythme et contrôle parfait.',
    steps: ['Lancer simultané', 'Rythme régulier', '5 cycles']
  },
  {
    nom: 'Jonglage 3 anneaux tricks',
    discipline: 'Anneaux',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Techniques spéciales avec anneaux : penguin catch, multiplex. Apporte variété et style personnel.',
    steps: ['Penguin catch', 'Multiplex', 'Reprise']
  },

  // Diabolo (4 figures artistiques)
  {
    nom: 'Diabolo lancer simple',
    discipline: 'Diabolo',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Lancer vertical du diabolo avec réception. Première étape vers les tricks aériens, développe la coordination œil-main.',
    steps: ['Accélération', 'Lancer vertical', 'Réception ficelle']
  },
  {
    nom: 'Diabolo génocide',
    discipline: 'Diabolo',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Figure iconique du diabolo avec lancer très haut et rotation de ficelle. Spectaculaire et technique.',
    steps: ['Lancer haut', 'Rotation ficelle', 'Réception']
  },
  {
    nom: 'Diabolo sun',
    discipline: 'Diabolo',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Le diabolo tourne autour de la ficelle comme le soleil. Figure esthétique qui nécessite un bon contrôle.',
    steps: ['Ficelle sur axe', 'Rotation autour', 'Reprise']
  },
  {
    nom: 'Diabolo 2 diabolos',
    discipline: 'Diabolo',
    type: 'artistique',
    difficulty_level: 5,
    descriptif: 'Manipulation de 2 diabolos simultanément. Défi ultime qui demande coordination exceptionnelle et maîtrise totale.',
    steps: ['Accélération des deux', 'Lancers alternés', 'Contrôle']
  },

  // Tissu (5 figures artistiques)
  {
    nom: 'Montée au tissu',
    discipline: 'Tissu',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Technique fondamentale pour grimper au tissu aérien. Développe force des bras et technique d\'enroulement des jambes.',
    steps: ['Enroulement jambe', 'Traction bras', 'Montée 3 mètres']
  },
  {
    nom: 'Clé de pied tissu',
    discipline: 'Tissu',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Position de blocage essentielle en tissu. Permet de se reposer en hauteur et prépare aux figures plus complexes.',
    lateralite_requise: 'bilateral',  // Doit être maîtrisée pied gauche ET droit
    steps: ['Enroulement cheville', 'Blocage', 'Position stable']
  },
  {
    nom: 'Chute avant tissu',
    discipline: 'Tissu',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Figure spectaculaire de chute contrôlée. Nécessite confiance en soi et maîtrise parfaite de l\'enroulement de sécurité.',
    steps: ['Position haute', 'Enroulement contrôlé', 'Chute sécurisée']
  },
  {
    nom: 'Salto tissu',
    discipline: 'Tissu',
    type: 'artistique',
    difficulty_level: 5,
    descriptif: 'Rotation complète en hauteur sur le tissu. Figure avancée qui combine acrobatie aérienne et contrôle du tissu.',
    steps: ['Élan', 'Rotation complète', 'Réception tissu']
  },
  {
    nom: 'Figure du scorpion',
    discipline: 'Tissu',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Position cambrée esthétique en tissu. Développe la souplesse du dos et la force de maintien en suspension.',
    steps: ['Montée', 'Cambré arrière', 'Tenue 5 secondes']
  },

  // Cerceau Aérien (5 figures artistiques)
  {
    nom: 'Montée au cerceau',
    discipline: 'Cerceau Aérien',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Technique de base pour accéder au cerceau aérien. Première étape avant toutes les figures en cerceau.',
    steps: ['Prise cerceau', 'Traction', 'Position assise']
  },
  {
    nom: 'Position de la sirène',
    discipline: 'Cerceau Aérien',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Figure élégante et gracieuse en cerceau. Combine souplesse du dos et force de maintien pour un effet visuel magnifique.',
    steps: ['Assise cerceau', 'Cambré arrière', 'Extension jambe']
  },
  {
    nom: 'Salto arrière cerceau',
    discipline: 'Cerceau Aérien',
    type: 'artistique',
    difficulty_level: 5,
    descriptif: 'Figure acrobatique avancée avec rotation arrière. Nécessite courage, technique et coordination parfaite avec le cerceau.',
    steps: ['Élan', 'Rotation arrière', 'Réception cerceau']
  },
  {
    nom: 'Ange au cerceau',
    discipline: 'Cerceau Aérien',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Position inversée spectaculaire avec extension des bras. Symbole de grâce et maîtrise technique en cerceau aérien.',
    steps: ['Position tête en bas', 'Extension bras', 'Tenue 10 secondes']
  },
  {
    nom: 'Rotation complète cerceau',
    discipline: 'Cerceau Aérien',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Rotation à 360° avec le cerceau. Figure dynamique qui demande timing et contrôle de la rotation.',
    steps: ['Élan', 'Rotation 360°', 'Contrôle']
  },

  // Trapèze (4 figures artistiques)
  {
    nom: 'Suspension trapèze',
    discipline: 'Trapèze',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Position de base en trapèze avec suspension par les genoux. Développe force et confiance en soi en hauteur.',
    steps: ['Prise barre', 'Suspension genoux', 'Tenue 30 secondes']
  },
  {
    nom: 'Balancier trapèze',
    discipline: 'Trapèze',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Technique de balancement contrôlé sur trapèze fixe. Base pour toutes les figures dynamiques en trapèze.',
    steps: ['Élan contrôlé', 'Amplitude maximale', '5 balancements']
  },
  {
    nom: 'Salto trapèze volant',
    discipline: 'Trapèze',
    type: 'artistique',
    difficulty_level: 5,
    descriptif: 'Figure mythique du trapèze volant. Rotation aérienne et réception par le porteur - apogée de la performance circassienne.',
    steps: ['Élan maximal', 'Rotation avant', 'Réception partenaire']
  },
  {
    nom: 'Figure du ange trapèze',
    discipline: 'Trapèze',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Position suspendue élégante en trapèze. Demande force abdominale et équilibre pour maintenir la posture.',
    steps: ['Suspension jambes', 'Extension bras', 'Position stable']
  },

  // Acrobatie (5 figures artistiques)
  {
    nom: 'Roue',
    discipline: 'Acrobatie',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Figure acrobatique fondamentale. Développe la coordination, l\'équilibre et la confiance dans le mouvement latéral.',
    lateralite_requise: 'bilateral',  // Doit être maîtrisée gauche ET droite
    steps: ['Élan latéral', 'Appui mains', 'Réception pieds']
  },
  {
    nom: 'Rondade',
    discipline: 'Acrobatie',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Mouvement acrobatique avec rotation de 180°. Souvent utilisée comme préparation au salto arrière.',
    steps: ['Course', 'Appui mains', 'Rotation 180°', 'Réception pieds joints']
  },
  {
    nom: 'Salto avant',
    discipline: 'Acrobatie',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Rotation avant complète sans appui. Nécessite impulsion, technique et courage pour une réception maîtrisée.',
    steps: ['Élan', 'Rotation avant complète', 'Réception debout']
  },
  {
    nom: 'Salto arrière',
    discipline: 'Acrobatie',
    type: 'artistique',
    difficulty_level: 5,
    descriptif: 'Rotation arrière complète - figure iconique du cirque. Demande technique impeccable et confiance totale.',
    steps: ['Élan arrière', 'Rotation complète', 'Réception sécurisée']
  },
  {
    nom: 'ATR (équilibre)',
    discipline: 'Acrobatie',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Appui Tendu Renversé - équilibre sur les mains. Base de nombreuses figures acrobatiques, développe force et contrôle.',
    steps: ['Appui mains', 'Alignement corps', 'Tenue 10 secondes']
  },

  // Pyramide (3 figures artistiques)
  {
    nom: 'Pyramide à 3',
    discipline: 'Pyramide',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Formation de base en pyramide humaine. Introduit aux concepts de porteur et voltigeur, développe confiance mutuelle.',
    steps: ['2 porteurs au sol', '1 voltigeur monté', 'Tenue stable']
  },
  {
    nom: 'Pyramide à 4',
    discipline: 'Pyramide',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Pyramide à deux niveaux. Nécessite coordination d\'équipe et renforcement musculaire des porteurs.',
    steps: ['Base 3 personnes', '1 voltigeur sommet', 'Équilibre']
  },
  {
    nom: 'Pyramide complexe 6 personnes',
    discipline: 'Pyramide',
    type: 'artistique',
    difficulty_level: 5,
    descriptif: 'Grande pyramide humaine spectaculaire. Défi collectif ultime qui demande force, coordination et timing parfait.',
    steps: ['Base 4 personnes', 'Niveau 2', 'Sommet', 'Coordination']
  },

  // Equilibre (4 figures artistiques)
  {
    nom: 'Marche boule',
    discipline: 'Boule',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Marche sur une boule d\'équilibre. Développe proprioception, équilibre dynamique et contrôle des micro-ajustements.',
    steps: ['Montée sur boule', 'Marche avant', '5 mètres']
  },
  {
    nom: 'Équilibre fil tendu',
    discipline: 'Fil tendu',
    type: 'artistique',
    difficulty_level: 4,
    descriptif: 'Marche sur fil de fer tendu. Figure classique qui demande concentration, équilibre et mental d\'acier.',
    steps: ['Montée sur fil', 'Marche', 'Traversée complète']
  },
  {
    nom: 'Équilibre fil mou',
    discipline: 'Fil mou',
    type: 'artistique',
    difficulty_level: 3,
    descriptif: 'Équilibre sur fil souple (slackline). Plus instable que le fil tendu, développe adaptabilité et réflexes.',
    steps: ['Montée fil mou', 'Équilibre', 'Traversée']
  },
  {
    nom: 'Rola Bola équilibre',
    discipline: 'Rola Bola',
    type: 'artistique',
    difficulty_level: 2,
    descriptif: 'Équilibre sur planche et rouleau. Introduction ludique aux disciplines d\'équilibre, base pour figures plus complexes.',
    steps: ['Montée planche', 'Équilibre sur rouleau', 'Tenue 30 secondes']
  }
];
