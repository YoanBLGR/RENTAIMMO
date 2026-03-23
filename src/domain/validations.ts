/**
 * Business validations for real estate scenarios
 * Returns AlerteMetier array for any issues found
 */

import { Scenario, AlerteMetier } from './types';
import { calculerResultatsScenario } from './calculs';

/**
 * Validate a complete scenario
 * Returns an array of alerts (erreurs, attentions, infos)
 */
export function validerScenario(scenario: Scenario): AlerteMetier[] {
  const alertes: AlerteMetier[] = [];

  // ===== VALIDATION: Acquisition =====

  if (scenario.acquisition.prixAchat <= 0) {
    alertes.push({
      type: 'erreur',
      code: 'PRIX_ACHAT_INVALIDE',
      message: 'Le prix d\'achat doit être > 0',
      details: `Prix actuel: ${scenario.acquisition.prixAchat}`,
    });
  }

  // ===== VALIDATION: Lots =====

  if (scenario.lots.length === 0) {
    alertes.push({
      type: 'erreur',
      code: 'PAS_DE_LOT',
      message: 'Au moins un lot est nécessaire',
    });
    return alertes; // Stop here if no lots
  }

  for (const lot of scenario.lots) {
    // Vérifier que les loyers ne sont pas zéro
    if (scenario.strategie === 'longue_duree' && lot.loyerMensuelLD === 0) {
      alertes.push({
        type: 'erreur',
        code: 'LOYER_ZERO',
        message: `Le lot "${lot.nom}" a un loyer mensuel de 0 en longue durée`,
      });
    }

    if (scenario.strategie === 'courte_duree' && lot.tarifNuiteeCD === 0) {
      alertes.push({
        type: 'erreur',
        code: 'TARIF_NUITEE_ZERO',
        message: `Le lot "${lot.nom}" a un tarif de nuitée de 0 en courte durée`,
      });
    }

    // Attention: taux occupation CD > 90% (hypothèse optimiste)
    if (
      scenario.strategie === 'courte_duree' &&
      lot.tauxOccupationCD > 0.9
    ) {
      alertes.push({
        type: 'attention',
        code: 'OCCUPATION_OPTIMISTE',
        message: `Le lot "${lot.nom}" a un taux d'occupation > 90%`,
        details: `Taux: ${(lot.tauxOccupationCD * 100).toFixed(1)}% - Hypothèse peut être optimiste`,
      });
    }
  }

  // ===== VALIDATION: Financement =====

  if (scenario.financement.tauxInteret < 0 || scenario.financement.tauxInteret > 0.15) {
    alertes.push({
      type: 'attention',
      code: 'TAUX_INTERET_SUSPECT',
      message: 'Le taux d\'intérêt semble non-réaliste (hors 0-15%)',
      details: `Taux actuel: ${(scenario.financement.tauxInteret * 100).toFixed(2)}%`,
    });
  }

  const dureesAnnees = scenario.financement.dureeMois / 12;
  if (scenario.financement.dureeMois < 12 || scenario.financement.dureeMois > 360) {
    alertes.push({
      type: 'attention',
      code: 'DUREE_PRET_SUSPECT',
      message: 'La durée du prêt doit être entre 1 et 30 ans',
      details: `Durée actuelle: ${dureesAnnees.toFixed(1)} ans`,
    });
  }

  // Vérifier que le montant du prêt ne dépasse pas le prix + travaux
  if (
    scenario.financement.montantPret >
    scenario.acquisition.prixAchat + scenario.acquisition.montantTravaux
  ) {
    alertes.push({
      type: 'attention',
      code: 'MONTANT_PRET_SUSPECT',
      message: 'Le montant du prêt dépasse le prix d\'achat + travaux',
      details: `Prêt: ${scenario.financement.montantPret}, Prix + travaux: ${scenario.acquisition.prixAchat + scenario.acquisition.montantTravaux}`,
    });
  }

  // ===== VALIDATION: Apport =====

  const fraisNotaire = scenario.acquisition.fraisNotaire > 0
    ? scenario.acquisition.fraisNotaire
    : scenario.acquisition.prixAchat * scenario.acquisition.fraisNotairePct;

  const fraisAgence = scenario.acquisition.fraisAgenceInclus
    ? 0
    : scenario.acquisition.fraisAgence;

  const fraisNonFinances = fraisNotaire + fraisAgence;

  if (scenario.apportPersonnel < fraisNonFinances) {
    alertes.push({
      type: 'erreur',
      code: 'APPORT_INSUFFISANT',
      message: 'L\'apport personnel doit couvrir au minimum les frais non financés',
      details: `Apport: ${scenario.apportPersonnel}, Frais non financés: ${fraisNonFinances}`,
    });
  }

  // ===== VALIDATION: Hypothèses =====

  if (scenario.hypotheses.tauxVacanceLD < 0 || scenario.hypotheses.tauxVacanceLD > 0.3) {
    alertes.push({
      type: 'attention',
      code: 'VACANCE_SUSPECT',
      message: 'Le taux de vacance en LD semble anormal (0-30% suggéré)',
      details: `Taux actuel: ${(scenario.hypotheses.tauxVacanceLD * 100).toFixed(1)}%`,
    });
  }

  if (scenario.hypotheses.tauxVacanceLD < 0.02) {
    alertes.push({
      type: 'attention',
      code: 'VACANCE_OPTIMISTE',
      message: 'Un taux de vacance < 2% est optimiste',
      details: `Taux actuel: ${(scenario.hypotheses.tauxVacanceLD * 100).toFixed(1)}%`,
    });
  }

  // ===== VALIDATION: Charges =====

  if (scenario.charges.gestionLocative > 0.15) {
    alertes.push({
      type: 'attention',
      code: 'GESTION_LOCATIVE_ELEVEE',
      message: 'Les frais de gestion locative semblent élevés (> 15%)',
      details: `Taux actuel: ${(scenario.charges.gestionLocative * 100).toFixed(1)}%`,
    });
  }

  // ===== VALIDATION: Résultats =====

  const resultats = calculerResultatsScenario(scenario);

  if (resultats.rendementBrut < 2) {
    alertes.push({
      type: 'attention',
      code: 'RENDEMENT_FAIBLE',
      message: 'Le rendement brut est très faible (< 2%)',
      details: `Rendement brut actuel: ${resultats.rendementBrut.toFixed(2)}%`,
    });
  }

  if (resultats.cashFlowAnnuelAvantImpot < 0) {
    alertes.push({
      type: 'attention',
      code: 'CASHFLOW_NEGATIF',
      message: 'Le cash-flow annuel avant impôt est négatif',
      details: `Cash-flow annuel: ${resultats.cashFlowAnnuelAvantImpot.toFixed(0)}€`,
    });
  }

  return alertes;
}

/**
 * Quick validation: check if scenario is valid enough for calculations
 * Returns true if no blocking errors
 */
export function validerScenarioBasique(scenario: Scenario): boolean {
  const alertes = validerScenario(scenario);
  const erreurs = alertes.filter((a) => a.type === 'erreur');
  return erreurs.length === 0;
}

/**
 * Get only error-type alerts
 */
export function obtenirErreurs(scenario: Scenario): AlerteMetier[] {
  const alertes = validerScenario(scenario);
  return alertes.filter((a) => a.type === 'erreur');
}

/**
 * Get only warning-type alerts
 */
export function obtenirAttentions(scenario: Scenario): AlerteMetier[] {
  const alertes = validerScenario(scenario);
  return alertes.filter((a) => a.type === 'attention');
}

/**
 * Format alert message for display
 */
export function formaterAlerte(alerte: AlerteMetier): string {
  let message = alerte.message;
  if (alerte.details) {
    message += ` (${alerte.details})`;
  }
  return message;
}
