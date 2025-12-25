# Stratégie Pricing Cirque App

## Modèle de Revenus : SaaS par Abonnement

### Offres Disponibles

#### 1. Offre Solo (Individuel)
**Public cible :** Artistes de cirque indépendants, coachs freelance

**Inclus :**
- 1 utilisateur (prof ou élève)
- Accès complet au catalogue public
- Création de figures personnalisées illimitées
- Suivi de progression personnel
- Upload vidéos/images (5 GB stockage)
- Stats et KPIs personnels
- Badges et gamification

**Prix :** 9€/mois ou 90€/an (-17%)

**Limite technique :**
- `ecole_id` = NULL pour utilisateurs solo
- Pas de gestion élèves/groupes
- Isolation via `utilisateur_id` uniquement

---

#### 2. Plan École Basic
**Public cible :** Petites écoles de cirque, associations

**Inclus :**
- 3 professeurs
- 50 élèves maximum
- Tout de l'offre Solo +
- Gestion élèves et groupes
- Invitations élèves
- Tableau de bord professeur
- Stats classe (météo, décrochage)
- Support par email (48h)

**Prix :** 29€/mois ou 290€/an (-17%)

**Limite technique :**
- 1 `ecole_id` attribué
- Max 50 rows dans `Utilisateurs` avec `ecole_id` = X et `role` = 'eleve'
- Max 3 rows avec `role` = 'professeur'

---

#### 3. Plan École Premium
**Public cible :** Écoles de cirque professionnelles, centres de formation

**Inclus :**
- Professeurs illimités
- 200 élèves maximum
- Tout du Plan Basic +
- Branding personnalisé (logo, couleurs thème)
- Statistiques avancées (export CSV)
- Figures privées par école
- Upload vidéos/images (50 GB stockage)
- Support prioritaire (24h)
- Assistance onboarding

**Prix :** 79€/mois ou 790€/an (-17%)

**Limite technique :**
- 1 `ecole_id` attribué
- Max 200 rows `Utilisateurs` avec `ecole_id` = X et `role` = 'eleve'
- Illimité professeurs
- Champ `config` JSON dans table `Ecoles` pour branding

---

## Récapitulatif Pricing

| Offre | Prix Mensuel | Prix Annuel | Élèves Max | Profs Max | Stockage |
|-------|--------------|-------------|------------|-----------|----------|
| Solo | 9€ | 90€ (-17%) | 0 | 1 | 5 GB |
| École Basic | 29€ | 290€ (-17%) | 50 | 3 | 20 GB |
| École Premium | 79€ | 790€ (-17%) | 200 | Illimité | 50 GB |

---

## Projection Revenus (20 clients)

**Scénario Conservateur :**
- 5 utilisateurs Solo × 9€ = 45€/mois
- 10 écoles Basic × 29€ = 290€/mois
- 5 écoles Premium × 79€ = 395€/mois

**Total :** 730€/mois = **8 760€/an**

**Coûts infrastructure :** ~130€/mois = 1 560€/an

**Marge brute :** 8 760€ - 1 560€ = **7 200€/an profit**

---

## Période d'Essai

**Essai gratuit 14 jours** pour toutes les offres :
- Carte bancaire requise à l'inscription
- Débit automatique après 14 jours
- Annulation possible pendant l'essai
- Conversion automatique en plan choisi

**Implémentation technique :**
```javascript
// Table Ecoles
{
  plan: 'solo|basic|premium',
  statut_paiement: 'trial|actif|suspendu|annule',
  date_fin_trial: Date,
  date_prochain_paiement: Date
}
```

---

## Upsell et Cross-Sell

### Passage Basic → Premium
**Triggers :**
- École atteint 40/50 élèves (email automatique)
- Professeur demande fonctionnalité Premium
- Support propose upgrade

**Incentive :** Premier mois Premium à 50% si upgrade annuel

### Add-ons Possibles (Future)
- **Stockage supplémentaire :** +10 GB = +5€/mois
- **Élèves supplémentaires (Basic) :** +10 élèves = +10€/mois
- **White-label (Premium+) :** Sous-domaine custom = +20€/mois

---

## Politique de Remboursement

**Garantie satisfait ou remboursé 30 jours** (abonnement annuel uniquement) :
- Remboursement intégral si annulation <30 jours
- Au prorata après 30 jours
- Données exportables avant suppression compte

---

## Facturation et Paiement

### Méthodes de Paiement Acceptées
1. **Carte bancaire** (Visa, Mastercard) - via Stripe
2. **SEPA Direct Debit** (Europe) - via Stripe
3. **Virement bancaire** (écoles uniquement, annuel)

### Cycle de Facturation
- **Mensuel :** Débit le même jour chaque mois
- **Annuel :** Débit unique, renouvellement auto 1 an après

### Factures
- Génération automatique PDF
- Envoi par email
- Téléchargement depuis dashboard
- Conformité TVA européenne (20%)

---

## Gestion des Défauts de Paiement

**Processus :**
1. **J+0 :** Échec paiement → Email automatique + 3 tentatives (J+2, J+4, J+7)
2. **J+7 :** Si toujours échec → Compte suspendu (lecture seule)
3. **J+14 :** Email final "Dernière chance"
4. **J+30 :** Suppression définitive des données école

**Réactivation :**
- Paiement arriérés + mois en cours
- Restauration complète des données (si <30 jours)

---

## Dashboard Admin - Vue Paiements

### Métriques Clés (Page d'Accueil)
```
┌─────────────────────────────────────────────────────┐
│  💰 Revenus Récurrents (MRR)                       │
│  730€/mois                                ↑ +12%   │
│                                                     │
│  📊 Répartition par Plan                           │
│  Solo: 45€ (6%)  |  Basic: 290€ (40%)              │
│  Premium: 395€ (54%)                                │
│                                                     │
│  🔔 Alertes                                         │
│  • 2 paiements échoués (École Trapèze, École Luna)│
│  • 1 trial se termine demain (École Jonglerie)    │
│  • 3 écoles proches limite élèves (upsell)        │
└─────────────────────────────────────────────────────┘
```

### Table Abonnements
| École | Plan | Statut | Élèves | Prochain Paiement | Montant | Actions |
|-------|------|--------|--------|-------------------|---------|---------|
| École Voltige | Premium | ✅ Actif | 145/200 | 15/01/2025 | 79€ | Détails \| Factures |
| École Trapèze | Basic | ⚠️ Échec paiement | 42/50 | 10/01/2025 (retard) | 29€ | Relancer \| Suspendre |
| Solo - Marie D. | Solo | ✅ Actif | - | 20/01/2025 | 9€ | Détails |
| École Jonglerie | Basic | 🆓 Trial (J+13) | 12/50 | 25/01/2025 | 29€ | Convertir |

### Filtres
- Par statut : Tous \| Actif \| Trial \| Suspendu \| Annulé
- Par plan : Tous \| Solo \| Basic \| Premium
- Par date paiement : Ce mois \| Mois prochain \| En retard

### Actions Admin
1. **Suspendre manuellement** (non-paiement, abus)
2. **Réactiver** (après règlement)
3. **Changer plan** (upgrade/downgrade manuel)
4. **Prolonger trial** (commercial)
5. **Exporter données comptables** (CSV pour compta)

---

## Indicateurs de Succès (KPIs Business)

### Acquisition
- **Taux de conversion trial → payant :** Objectif >60%
- **Coût d'acquisition client (CAC) :** <100€ (marketing + sales)

### Rétention
- **Churn rate mensuel :** Objectif <5%
- **Lifetime Value (LTV) :** Objectif >500€
- **Ratio LTV/CAC :** Objectif >5

### Expansion
- **Taux d'upgrade Basic → Premium :** Objectif >20%
- **Revenus add-ons :** Objectif 10% du MRR

---

## Conformité Légale

### RGPD
- Consentement explicite traitement paiement
- Droit à l'oubli : suppression données + remboursement prorata
- Export données personnelles sur demande

### Facturation
- Mentions légales sur factures
- TVA intracommunautaire (si clients UE)
- Conservation factures 10 ans (obligation légale France)

### CGV/CGU
- Conditions Générales de Vente (CGV)
- Conditions Générales d'Utilisation (CGU)
- Politique de confidentialité
- Acceptation obligatoire avant paiement

---

## Timeline Implémentation Paiements

**Phase 1 (MVP) :** Abonnements manuels
- Admin crée école manuellement
- Paiement hors plateforme (virement)
- Activation manuelle après réception

**Phase 2 (T+3 mois) :** Stripe intégration
- Checkout Stripe pour cartes bancaires
- Webhooks gestion abonnements
- Dashboard admin basique

**Phase 3 (T+6 mois) :** Automatisation complète
- Essais gratuits automatiques
- Emails transactionnels (Stripe)
- Facturation automatique
- Gestion défauts paiement

**Phase 4 (T+12 mois) :** Optimisation
- A/B testing pricing
- Add-ons et upsells
- Analytics avancés
- Self-service client (changement plan)
