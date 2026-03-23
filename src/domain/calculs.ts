/**
 * Calculation engine for real estate simulations
 * All business logic centralized here. NO UI code. Pure functions.
 */

import {
  Scenario,
  Lot,
  Financement,
  Charges,
  Acquisition,
  ResultatsLot,
  ResultatsFinancement,
  LigneAmortissement,
  ResultatsScenario,
  ComparaisonScenarios,
  StrategyType,
} from './types';

// ===== PRÊT & FINANCEMENT =====

/**
 * Calculate monthly payment for a loan with constant annuities
 * Formula: M = K * t / (1 - (1+t)^-n)
 * where:
 *   K = capital (montant du prêt)
 *   t = monthly interest rate (taux annuel / 12)
 *   n = number of months
 */
export function calculerMensualitePret(
  montantPret: number,
  tauxAnnuel: number,
  dureeMois: number
): number {
  if (montantPret <= 0 || dureeMois <= 0) {
    return 0;
  }

  if (tauxAnnuel === 0) {
    // Zero rate: simple division
    return montantPret / dureeMois;
  }

  const tauxMensuel = tauxAnnuel / 12;
  const denominateur = 1 - Math.pow(1 + tauxMensuel, -dureeMois);

  if (denominateur === 0) {
    return 0;
  }

  return (montantPret * tauxMensuel) / denominateur;
}

/**
 * Generate full amortization table for a loan
 * Handles regular amortization and "différé" period
 */
export function calculerTableauAmortissement(
  financement: Financement
): LigneAmortissement[] {
  const tableau: LigneAmortissement[] = [];
  const { montantPret, tauxInteret, dureeMois, differeMois, typeAmortissement } =
    financement;

  if (montantPret <= 0 || dureeMois <= 0) {
    return tableau;
  }

  const tauxMensuel = tauxInteret / 12;
  let capitalRestant = montantPret;

  // Différé period (interest-only)
  for (let mois = 1; mois <= differeMois; mois++) {
    const interets = capitalRestant * tauxMensuel;
    tableau.push({
      mois,
      capitalRestant,
      mensualite: interets,
      partCapital: 0,
      partInterets: interets,
      assurance: financement.assuranceEmprunteurMensuelle,
    });
  }

  // Regular amortization period
  const dureePropre = dureeMois - differeMois;

  if (typeAmortissement === 'lineaire' && dureePropre > 0) {
    // Linéaire: capital fixe chaque mois, intérêts décroissants
    const partCapitalFixe = capitalRestant / dureePropre;

    for (let mois = differeMois + 1; mois <= dureeMois; mois++) {
      const interets = capitalRestant * tauxMensuel;
      const mensualite = partCapitalFixe + interets;
      capitalRestant -= partCapitalFixe;

      if (capitalRestant < 0.01) capitalRestant = 0;

      tableau.push({
        mois,
        capitalRestant,
        mensualite,
        partCapital: partCapitalFixe,
        partInterets: interets,
        assurance: financement.assuranceEmprunteurMensuelle,
      });
    }
  } else if (dureePropre > 0) {
    // Constant (annuités constantes): mensualité fixe
    const mensualite = calculerMensualitePret(capitalRestant, tauxInteret, dureePropre);

    for (let mois = differeMois + 1; mois <= dureeMois; mois++) {
      const interets = capitalRestant * tauxMensuel;
      const partCapital = mensualite - interets;
      capitalRestant -= partCapital;

      if (capitalRestant < 0.01) capitalRestant = 0;

      tableau.push({
        mois,
        capitalRestant,
        mensualite,
        partCapital,
        partInterets: interets,
        assurance: financement.assuranceEmprunteurMensuelle,
      });
    }
  }

  return tableau;
}

/**
 * Calculate financing results
 */
export function calculerResultatsFinancement(
  financement: Financement
): ResultatsFinancement {
  const tableau = calculerTableauAmortissement(financement);

  if (tableau.length === 0) {
    return {
      mensualiteHorsAssurance: 0,
      mensualiteAvecAssurance: 0,
      coutTotalCredit: 0,
      coutTotalInterets: 0,
      coutTotalAssurance: 0,
      tableauAmortissement: [],
    };
  }

  // For linéaire, mensualité varies — use first regular payment (after différé)
  const premiereLigneAmortissement = tableau.find(l => l.partCapital > 0) ?? tableau[0];
  const mensualiteHorsAssurance = premiereLigneAmortissement.mensualite;
  const mensualiteAvecAssurance =
    mensualiteHorsAssurance + financement.assuranceEmprunteurMensuelle;

  let coutTotalInterets = 0;
  let coutTotalAssurance = 0;

  for (const ligne of tableau) {
    coutTotalInterets += ligne.partInterets;
    coutTotalAssurance += ligne.assurance;
  }

  const coutTotalCredit =
    financement.montantPret +
    coutTotalInterets +
    financement.fraisDossier +
    financement.fraisGarantie;

  return {
    mensualiteHorsAssurance,
    mensualiteAvecAssurance,
    coutTotalCredit,
    coutTotalInterets,
    coutTotalAssurance,
    tableauAmortissement: tableau,
  };
}

// ===== REVENUS PAR LOT =====

/**
 * Calculate revenues for a single lot
 * Depends on strategy (longue_duree vs courte_duree)
 */
export function calculerRevenusLot(
  lot: Lot,
  strategie: StrategyType,
  tauxVacanceLD: number
): ResultatsLot {
  let revenuBrutAnnuel = 0;
  let chargesExploitationLot = 0;

  if (strategie === 'longue_duree') {
    // LD: loyer mensuel * 12 * (1 - taux vacance)
    revenuBrutAnnuel = lot.loyerMensuelLD * 12 * (1 - tauxVacanceLD);
  } else if (strategie === 'courte_duree') {
    // CD: tarif nuitée * 365 * taux occupation
    const nuitees = 365 * lot.tauxOccupationCD;
    revenuBrutAnnuel = lot.tarifNuiteeCD * nuitees;

    // Nombre de rotations (séjours) = nuitées / durée moyenne séjour
    const dureeSejour = Math.max(lot.dureeMoyenneSejourCD || 1, 1);
    const rotations = nuitees / dureeSejour;

    // Ménage = par rotation (1 ménage par séjour, pas par nuit)
    // Linge & consommables = par nuitée (usage quotidien)
    const chargesMenageAnnuelles = rotations * lot.chargesMenageParNuitee;
    const chargesNuiteesAnnuelles = nuitees * (lot.chargesLingeParNuitee + lot.chargesConsommablesParNuitee);

    chargesExploitationLot =
      chargesMenageAnnuelles +
      chargesNuiteesAnnuelles +
      revenuBrutAnnuel * lot.commissionPlateformeCD;
  }

  const revenuNetLotAnnuel = revenuBrutAnnuel - chargesExploitationLot;
  const revenuBrutMensuel = revenuBrutAnnuel / 12;

  return {
    lotId: lot.id,
    revenuBrutAnnuel,
    revenuBrutMensuel,
    chargesExploitationLotAnnuel: chargesExploitationLot,
    revenuNetLotAnnuel,
  };
}

// ===== INVESTISSEMENT TOTAL =====

/**
 * Calculate total investment required
 * Includes: price + notaire + agence + travaux + ameublement + frais financement
 */
export function calculerInvestissementTotal(
  acquisition: Acquisition,
  financement: Financement
): number {
  const fraisNotaire = acquisition.fraisNotaire > 0
    ? acquisition.fraisNotaire
    : acquisition.prixAchat * acquisition.fraisNotairePct;

  const fraisAgenceEffectifs = acquisition.fraisAgenceInclus
    ? 0
    : acquisition.fraisAgence;

  return (
    acquisition.prixAchat +
    fraisNotaire +
    fraisAgenceEffectifs +
    acquisition.montantTravaux +
    acquisition.montantAmeublement +
    acquisition.autresFrais +
    financement.fraisDossier +
    financement.fraisGarantie
  );
}

// ===== CHARGES EXPLOITATION =====

/**
 * Calculate exploitation charges
 */
export function calculerChargesExploitation(
  charges: Charges,
  revenuBrutAnnuel: number,
  strategie: StrategyType,
  lots: Lot[]
): {
  detailCharges: {
    taxeFonciere: number;
    assurances: number;
    entretien: number;
    gestionLocative: number;
    comptabilite: number;
    copropriete: number;
    cfe: number;
    chargesLotsCourtesDuree: number;
    autresCharges: number;
  };
  totalCharges: number;
} {
  const gestionLocativeAnnuelle = revenuBrutAnnuel * charges.gestionLocative;
  const assurancesTotales = charges.assurancePNO + charges.assuranceLoyers;

  // CD-specific charges (already calculated per lot)
  let chargesLotsCourtesDuree = 0;
  if (strategie === 'courte_duree') {
    for (const lot of lots) {
      const resultatsLot = calculerRevenusLot(lot, strategie, 0);
      chargesLotsCourtesDuree += resultatsLot.chargesExploitationLotAnnuel;
    }
  }

  const detailCharges = {
    taxeFonciere: charges.taxeFonciere,
    assurances: assurancesTotales,
    entretien: charges.entretienCourant + charges.grosEntretien,
    gestionLocative: gestionLocativeAnnuelle,
    comptabilite: charges.comptabilite,
    copropriete: charges.copropriete,
    cfe: strategie === 'courte_duree' ? charges.cfe : 0,
    chargesLotsCourtesDuree,
    autresCharges: charges.autresCharges,
  };

  const totalCharges = Object.values(detailCharges).reduce((a, b) => a + b, 0);

  return { detailCharges, totalCharges };
}

// ===== SCENARIO RESULTS =====

/**
 * Calculate all results for a scenario
 */
export function calculerResultatsScenario(scenario: Scenario): ResultatsScenario {
  // Calculate revenues per lot
  const resultatsParLot: ResultatsLot[] = [];
  let revenuBrutAnnuel = 0;

  for (const lot of scenario.lots) {
    const resultats = calculerRevenusLot(
      lot,
      scenario.strategie,
      scenario.hypotheses.tauxVacanceLD
    );
    resultatsParLot.push(resultats);
    revenuBrutAnnuel += resultats.revenuBrutAnnuel;
  }

  const revenuBrutMensuel = revenuBrutAnnuel / 12;

  // Calculate charges
  const { detailCharges, totalCharges: chargesExploitationAnnuelles } =
    calculerChargesExploitation(
      scenario.charges,
      revenuBrutAnnuel,
      scenario.strategie,
      scenario.lots
    );

  const chargesExploitationMensuelles = chargesExploitationAnnuelles / 12;

  // Calculate financing
  const financementResultats = calculerResultatsFinancement(
    scenario.financement
  );
  const chargeFinancementMensuelle =
    financementResultats.mensualiteAvecAssurance;
  const chargeFinancementAnnuelle = chargeFinancementMensuelle * 12;

  // Calculate investment
  const investissementTotal = calculerInvestissementTotal(
    scenario.acquisition,
    scenario.financement
  );

  // Calculate apport total
  const fraisNotaire = scenario.acquisition.fraisNotaire > 0
    ? scenario.acquisition.fraisNotaire
    : scenario.acquisition.prixAchat * scenario.acquisition.fraisNotairePct;

  const fraisAgence = scenario.acquisition.fraisAgenceInclus
    ? 0
    : scenario.acquisition.fraisAgence;

  const fraisNonFinances = fraisNotaire + fraisAgence;
  const apportTotal = scenario.apportPersonnel + fraisNonFinances;

  // Calculate cash-flows
  const cashFlowAnnuelAvantImpot =
    revenuBrutAnnuel -
    chargesExploitationAnnuelles -
    chargeFinancementAnnuelle;
  const cashFlowMensuelAvantImpot = cashFlowAnnuelAvantImpot / 12;

  // Calculate yields
  const rendementBrut = investissementTotal > 0
    ? (revenuBrutAnnuel / investissementTotal) * 100
    : 0;

  const revenuNetExploitation = revenuBrutAnnuel - chargesExploitationAnnuelles;
  const rendementNet = investissementTotal > 0
    ? (revenuNetExploitation / investissementTotal) * 100
    : 0;

  const rendementNetNet = investissementTotal > 0
    ? (cashFlowAnnuelAvantImpot / investissementTotal) * 100
    : 0;

  const cashOnCash = apportTotal > 0
    ? (cashFlowAnnuelAvantImpot / apportTotal) * 100
    : 0;

  return {
    scenarioId: scenario.id,
    scenarioNom: scenario.nom,
    strategie: scenario.strategie,
    investissementTotal,
    apportTotal,
    revenuBrutAnnuel,
    revenuBrutMensuel,
    resultatsParLot,
    chargesExploitationAnnuelles,
    chargesExploitationMensuelles,
    detailCharges,
    financement: financementResultats,
    chargeFinancementMensuelle,
    chargeFinancementAnnuelle,
    cashFlowMensuelAvantImpot,
    cashFlowAnnuelAvantImpot,
    rendementBrut,
    rendementNet,
    rendementNetNet,
    cashOnCash,
    alertes: [], // Populated by validation
  };
}

// ===== COMPARAISON =====

/**
 * Compare multiple scenarios
 */
export function comparerScenarios(scenarios: Scenario[]): ComparaisonScenarios {
  const resultats = scenarios.map(calculerResultatsScenario);

  // Find best performers
  let meilleurCashFlow = resultats[0]?.scenarioId || '';
  let meilleurRendementBrut = resultats[0]?.scenarioId || '';
  let meilleurRendementNet = resultats[0]?.scenarioId || '';

  let maxCashFlow = -Infinity;
  let maxRendementBrut = -Infinity;
  let maxRendementNet = -Infinity;

  for (const r of resultats) {
    if (r.cashFlowAnnuelAvantImpot > maxCashFlow) {
      maxCashFlow = r.cashFlowAnnuelAvantImpot;
      meilleurCashFlow = r.scenarioId;
    }
    if (r.rendementBrut > maxRendementBrut) {
      maxRendementBrut = r.rendementBrut;
      meilleurRendementBrut = r.scenarioId;
    }
    if (r.rendementNet > maxRendementNet) {
      maxRendementNet = r.rendementNet;
      meilleurRendementNet = r.scenarioId;
    }
  }

  const synthese = `Comparaison de ${resultats.length} scénario(s): ` +
    `Meilleur cash-flow: ${meilleurCashFlow}, ` +
    `Meilleur rendement brut: ${meilleurRendementBrut}, ` +
    `Meilleur rendement net: ${meilleurRendementNet}`;

  return {
    scenarios: resultats,
    meilleurCashFlow,
    meilleurRendementBrut,
    meilleurRendementNet,
    synthese,
  };
}
