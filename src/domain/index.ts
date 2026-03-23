/**
 * Domain layer barrel export
 * Convenience exports for importing domain functionality
 */

// Export all types
export type { 
  StrategyType,
  Lot,
  Financement,
  Charges,
  Acquisition,
  HypothesesExploitation,
  Scenario,
  Simulation,
  ResultatsLot,
  ResultatsFinancement,
  LigneAmortissement,
  ResultatsScenario,
  AlerteMetier,
  ComparaisonScenarios,
  ImportAnnonceLot,
  ImportAnnonceResult,
} from './types';

// Export calculation functions
export {
  calculerMensualitePret,
  calculerTableauAmortissement,
  calculerResultatsFinancement,
  calculerRevenusLot,
  calculerInvestissementTotal,
  calculerChargesExploitation,
  calculerResultatsScenario,
  comparerScenarios,
} from './calculs';

// Export validation functions
export {
  validerScenario,
  validerScenarioBasique,
  obtenirErreurs,
  obtenirAttentions,
  formaterAlerte,
} from './validations';

// Export factory functions and defaults
export {
  creerLotVide,
  creerFinancementVide,
  creerChargesVides,
  creerAcquisitionVide,
  creerHypothesesVides,
  creerScenarioVide,
  creerSimulationVide,
  creerScenarioLDTypique,
  creerScenarioCDTypique,
  creerSimulationDepuisImport,
  creerScenarioBeauvaisLD,
  creerScenarioBeauvaisCD,
  creerSimulationBeauvais,
  DEFAULTS,
  DEFAULTS_BEAUVAIS,
} from './defaults';

export {
  calculerMontantPretRecommande,
  synchroniserFinancementAvecProjet,
  harmoniserScenarioApresEdition,
} from './scenario-updates';
