import {
  calculerMensualitePret,
  calculerTableauAmortissement,
  calculerResultatsFinancement,
  calculerRevenusLot,
  calculerInvestissementTotal,
  calculerChargesExploitation,
  calculerResultatsScenario,
  comparerScenarios,
} from '../calculs';
import {
  creerScenarioVide,
  creerLotVide,
  creerScenarioLDTypique,
  creerScenarioCDTypique,
  creerFinancementVide,
  creerChargesVides,
  creerAcquisitionVide,
} from '../defaults';
import { Financement, Lot, Acquisition } from '../types';

describe('calculerMensualitePret', () => {
  test('standard 20-year loan at 3.5%', () => {
    // 250,000€ at 3.5% over 240 months
    const mensualite = calculerMensualitePret(250000, 0.035, 240);
    // Expected: ~1449€/month
    expect(mensualite).toBeGreaterThan(1440);
    expect(mensualite).toBeLessThan(1460);
  });

  test('zero rate loan', () => {
    const mensualite = calculerMensualitePret(120000, 0, 240);
    expect(mensualite).toBe(500); // 120000 / 240
  });

  test('zero amount', () => {
    expect(calculerMensualitePret(0, 0.035, 240)).toBe(0);
  });

  test('zero duration', () => {
    expect(calculerMensualitePret(250000, 0.035, 0)).toBe(0);
  });

  test('negative amount returns 0', () => {
    expect(calculerMensualitePret(-250000, 0.035, 240)).toBe(0);
  });

  test('negative duration returns 0', () => {
    expect(calculerMensualitePret(250000, 0.035, -240)).toBe(0);
  });
});

describe('calculerTableauAmortissement', () => {
  test('generates correct number of rows', () => {
    const financement: Financement = {
      id: 'test',
      nom: 'Test',
      montantPret: 200000,
      tauxInteret: 0.035,
      dureeMois: 240,
      differeMois: 0,
      typeAmortissement: 'constant',
      assuranceEmprunteurMensuelle: 50,
      fraisDossier: 0,
      fraisGarantie: 0,
    };
    const tableau = calculerTableauAmortissement(financement);
    expect(tableau.length).toBe(240);
  });

  test('capital restant at end is near zero', () => {
    const financement: Financement = {
      id: 'test',
      nom: 'Test',
      montantPret: 200000,
      tauxInteret: 0.035,
      dureeMois: 240,
      differeMois: 0,
      typeAmortissement: 'constant',
      assuranceEmprunteurMensuelle: 50,
      fraisDossier: 0,
      fraisGarantie: 0,
    };
    const tableau = calculerTableauAmortissement(financement);
    const lastRow = tableau[tableau.length - 1];
    expect(lastRow.capitalRestant).toBeLessThan(1); // Should be ~0
  });

  test('différé period has zero capital repayment', () => {
    const financement: Financement = {
      id: 'test',
      nom: 'Test',
      montantPret: 200000,
      tauxInteret: 0.035,
      dureeMois: 240,
      differeMois: 12,
      typeAmortissement: 'constant',
      assuranceEmprunteurMensuelle: 50,
      fraisDossier: 0,
      fraisGarantie: 0,
    };
    const tableau = calculerTableauAmortissement(financement);
    // First 12 months should be interest-only
    for (let i = 0; i < 12; i++) {
      expect(tableau[i].partCapital).toBe(0);
      expect(tableau[i].partInterets).toBeGreaterThan(0);
    }
    // After différé, capital starts being repaid
    expect(tableau[12].partCapital).toBeGreaterThan(0);
  });

  test('empty table for zero amount', () => {
    const financement: Financement = {
      id: 'test',
      nom: 'Test',
      montantPret: 0,
      tauxInteret: 0.035,
      dureeMois: 240,
      differeMois: 0,
      typeAmortissement: 'constant',
      assuranceEmprunteurMensuelle: 50,
      fraisDossier: 0,
      fraisGarantie: 0,
    };
    const tableau = calculerTableauAmortissement(financement);
    expect(tableau.length).toBe(0);
  });

  test('linear amortization type', () => {
    const financement: Financement = {
      id: 'test',
      nom: 'Test',
      montantPret: 200000,
      tauxInteret: 0.035,
      dureeMois: 240,
      differeMois: 0,
      typeAmortissement: 'lineaire',
      assuranceEmprunteurMensuelle: 0,
      fraisDossier: 0,
      fraisGarantie: 0,
    };
    const tableau = calculerTableauAmortissement(financement);
    // In linear amortization, mensualité is constant = capital / duration
    const mensualiteAttendeur = 200000 / 240; // ~833.33
    for (let i = 0; i < 10; i++) {
      expect(tableau[i].mensualite).toBeCloseTo(mensualiteAttendeur, 1);
    }
    // Capital repayment decreases as interest decreases (since mensualité - intérêts = capital repay)
    expect(tableau[0].partCapital).toBeLessThan(tableau[239].partCapital);
  });
});

describe('calculerResultatsFinancement', () => {
  test('calculates financing results correctly', () => {
    const financement: Financement = {
      id: 'test',
      nom: 'Test',
      montantPret: 250000,
      tauxInteret: 0.035,
      dureeMois: 240,
      differeMois: 0,
      typeAmortissement: 'constant',
      assuranceEmprunteurMensuelle: 60,
      fraisDossier: 1500,
      fraisGarantie: 1250,
    };
    const resultats = calculerResultatsFinancement(financement);

    expect(resultats.mensualiteHorsAssurance).toBeGreaterThan(0);
    expect(resultats.mensualiteAvecAssurance).toBeGreaterThan(resultats.mensualiteHorsAssurance);
    expect(resultats.coutTotalCredit).toBeGreaterThan(250000);
    expect(resultats.coutTotalInterets).toBeGreaterThan(0);
    expect(resultats.coutTotalAssurance).toBe(60 * 240); // 14400
    expect(resultats.tableauAmortissement.length).toBe(240);
  });
});

describe('calculerRevenusLot - Longue Durée', () => {
  test('calculates LD revenues correctly', () => {
    const lot: Lot = {
      ...creerLotVide(),
      loyerMensuelLD: 800,
    };
    const result = calculerRevenusLot(lot, 'longue_duree', 0.05);
    // 800 * 12 * 0.95 = 9120
    expect(result.revenuBrutAnnuel).toBeCloseTo(9120, 0);
    expect(result.revenuBrutMensuel).toBeCloseTo(760, 0);
    expect(result.chargesExploitationLotAnnuel).toBe(0); // No lot-level charges for LD
  });

  test('100% vacancy means 0 revenue', () => {
    const lot = creerLotVide();
    const result = calculerRevenusLot(lot, 'longue_duree', 1.0);
    expect(result.revenuBrutAnnuel).toBe(0);
  });

  test('0% vacancy means full revenue', () => {
    const lot: Lot = {
      ...creerLotVide(),
      loyerMensuelLD: 1000,
    };
    const result = calculerRevenusLot(lot, 'longue_duree', 0);
    expect(result.revenuBrutAnnuel).toBeCloseTo(12000, 0);
  });
});

describe('calculerRevenusLot - Courte Durée', () => {
  test('calculates CD revenues with durée séjour = 2 nuits', () => {
    const lot: Lot = {
      ...creerLotVide(),
      tarifNuiteeCD: 80,
      tauxOccupationCD: 0.65,
      dureeMoyenneSejourCD: 2,
      chargesMenageParNuitee: 15,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.15,
    };
    const result = calculerRevenusLot(lot, 'courte_duree', 0);
    const nuitees = 365 * 0.65; // 237.25
    const rotations = nuitees / 2; // 118.625
    const expectedRevenu = 80 * nuitees; // 18980
    expect(result.revenuBrutAnnuel).toBeCloseTo(expectedRevenu, 0);

    // Ménage par rotation, linge+consommables par nuitée
    const expectedCharges = rotations * 15 + nuitees * (5 + 3) + expectedRevenu * 0.15;
    expect(result.chargesExploitationLotAnnuel).toBeCloseTo(expectedCharges, 0);
  });

  test('durée séjour = 1 nuit gives ménage per night', () => {
    const lot: Lot = {
      ...creerLotVide(),
      tarifNuiteeCD: 80,
      tauxOccupationCD: 0.65,
      dureeMoyenneSejourCD: 1,
      chargesMenageParNuitee: 15,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.15,
    };
    const result = calculerRevenusLot(lot, 'courte_duree', 0);
    const nuitees = 365 * 0.65;
    // With 1 night per stay, rotations = nuitees → ménage same as old formula
    const expectedCharges = nuitees * 15 + nuitees * (5 + 3) + (80 * nuitees) * 0.15;
    expect(result.chargesExploitationLotAnnuel).toBeCloseTo(expectedCharges, 0);
  });

  test('longer séjour reduces ménage costs significantly', () => {
    const baseLot: Lot = {
      ...creerLotVide(),
      tarifNuiteeCD: 80,
      tauxOccupationCD: 0.65,
      chargesMenageParNuitee: 20,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.15,
    };
    const lot1Nuit = { ...baseLot, dureeMoyenneSejourCD: 1 };
    const lot3Nuits = { ...baseLot, dureeMoyenneSejourCD: 3 };

    const r1 = calculerRevenusLot(lot1Nuit, 'courte_duree', 0);
    const r3 = calculerRevenusLot(lot3Nuits, 'courte_duree', 0);

    // Revenue unchanged
    expect(r1.revenuBrutAnnuel).toBeCloseTo(r3.revenuBrutAnnuel, 0);
    // But charges are lower with longer stays (less ménage)
    expect(r3.chargesExploitationLotAnnuel).toBeLessThan(r1.chargesExploitationLotAnnuel);
  });

  test('CD with 0% occupation', () => {
    const lot: Lot = {
      ...creerLotVide(),
      tarifNuiteeCD: 80,
      tauxOccupationCD: 0,
      dureeMoyenneSejourCD: 2,
      chargesMenageParNuitee: 15,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.15,
    };
    const result = calculerRevenusLot(lot, 'courte_duree', 0);
    expect(result.revenuBrutAnnuel).toBe(0);
    expect(result.chargesExploitationLotAnnuel).toBe(0);
  });

  test('CD with 100% occupation', () => {
    const lot: Lot = {
      ...creerLotVide(),
      tarifNuiteeCD: 100,
      tauxOccupationCD: 1.0,
      dureeMoyenneSejourCD: 2,
      chargesMenageParNuitee: 20,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.1,
    };
    const result = calculerRevenusLot(lot, 'courte_duree', 0);
    const expectedRevenu = 100 * 365; // 36500
    expect(result.revenuBrutAnnuel).toBeCloseTo(expectedRevenu, 0);

    // rotations = 365/2 = 182.5
    // Charges: 182.5 * 20 + 365 * 8 + 36500 * 0.1 = 3650 + 2920 + 3650 = 10220
    const expectedCharges = (365 / 2) * 20 + 365 * 8 + expectedRevenu * 0.1;
    expect(result.chargesExploitationLotAnnuel).toBeCloseTo(expectedCharges, 0);
  });
});

describe('calculerInvestissementTotal', () => {
  test('calculates investment total with all components', () => {
    const acquisition = creerAcquisitionVide(300000);
    acquisition.fraisNotaire = 24000; // 8% de 300k
    acquisition.fraisAgence = 0;
    acquisition.montantTravaux = 20000;
    acquisition.montantAmeublement = 5000;
    acquisition.autresFrais = 1000;

    const financement = {
      ...creerFinancementVide(200000),
      fraisDossier: 1500,
      fraisGarantie: 1000,
    };

    const investissementTotal = calculerInvestissementTotal(acquisition, financement);
    // 300k + 24k + 0 + 20k + 5k + 1k + 1.5k + 1k = 352.5k
    expect(investissementTotal).toBeCloseTo(352500, 0);
  });

  test('applies frais notaire percentage when fraisNotaire is 0', () => {
    const acquisition: Acquisition = {
      prixAchat: 250000,
      fraisNotaire: 0,
      fraisNotairePct: 0.08,
      fraisAgence: 0,
      fraisAgenceInclus: true,
      montantTravaux: 0,
      detailTravaux: '',
      montantAmeublement: 0,
      autresFrais: 0,
      descriptionAutresFrais: '',
    };
    const financement: Financement = {
      ...creerFinancementVide(0),
      fraisDossier: 0,
      fraisGarantie: 0,
    };

    const investissementTotal = calculerInvestissementTotal(acquisition, financement);
    // 250k + (250k * 0.08) = 270k
    expect(investissementTotal).toBeCloseTo(270000, 0);
  });
});

describe('calculerChargesExploitation', () => {
  test('calculates LD charges correctly', () => {
    const charges = creerChargesVides();
    const revenuBrutAnnuel = 20000;
    const lots = [creerLotVide()];

    const { totalCharges, detailCharges } = calculerChargesExploitation(
      charges,
      revenuBrutAnnuel,
      'longue_duree',
      lots
    );

    expect(totalCharges).toBeGreaterThan(0);
    expect(detailCharges.gestionLocative).toBeCloseTo(20000 * 0.08, 0);
    expect(detailCharges.chargesLotsCourtesDuree).toBe(0); // LD has no CD lot charges
  });

  test('calculates CD charges including lot-specific charges', () => {
    const charges = creerChargesVides();
    const revenuBrutAnnuel = 30000;
    const lot: Lot = {
      ...creerLotVide(),
      tarifNuiteeCD: 80,
      tauxOccupationCD: 0.65,
      chargesMenageParNuitee: 20,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.15,
    };

    const { totalCharges, detailCharges } = calculerChargesExploitation(
      charges,
      revenuBrutAnnuel,
      'courte_duree',
      [lot]
    );

    expect(totalCharges).toBeGreaterThan(0);
    expect(detailCharges.chargesLotsCourtesDuree).toBeGreaterThan(0);
    expect(detailCharges.cfe).toBe(charges.cfe); // CFE only for CD
  });
});

describe('calculerResultatsScenario', () => {
  test('LD scenario produces valid results', () => {
    const scenario = creerScenarioLDTypique();
    const result = calculerResultatsScenario(scenario);

    expect(result.revenuBrutAnnuel).toBeGreaterThan(0);
    expect(result.investissementTotal).toBeGreaterThan(0);
    expect(result.rendementBrut).toBeGreaterThan(0);
    expect(result.chargeFinancementMensuelle).toBeGreaterThan(0);
    expect(result.resultatsParLot.length).toBe(2);
    expect(result.rendementBrut).toBeLessThan(50); // Sanity check
  });

  test('CD scenario produces valid results', () => {
    const scenario = creerScenarioCDTypique();
    const result = calculerResultatsScenario(scenario);

    expect(result.revenuBrutAnnuel).toBeGreaterThan(0);
    expect(result.investissementTotal).toBeGreaterThan(0);
    expect(result.rendementBrut).toBeGreaterThan(0);
    expect(result.resultatsParLot.length).toBe(3);
    expect(result.detailCharges.chargesLotsCourtesDuree).toBeGreaterThan(0);
  });

  test('rendement brut formula is correct', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.lots = [
      {
        ...creerLotVide(),
        loyerMensuelLD: 1000,
      },
    ];
    scenario.acquisition.prixAchat = 100000;
    scenario.acquisition.montantTravaux = 0;
    scenario.acquisition.fraisNotairePct = 0;
    scenario.acquisition.fraisAgence = 0;
    scenario.financement.fraisDossier = 0;
    scenario.financement.fraisGarantie = 0;
    scenario.hypotheses.tauxVacanceLD = 0;

    const result = calculerResultatsScenario(scenario);
    // Revenus: 1000 * 12 = 12000
    // Investissement: 100000
    // Rendement brut: 12000/100000 * 100 = 12%
    expect(result.rendementBrut).toBeCloseTo(12.0, 1);
  });

  test('cash-flow calculation is correct', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.lots = [
      {
        ...creerLotVide(),
        loyerMensuelLD: 1000,
      },
    ];
    scenario.acquisition.prixAchat = 100000;
    scenario.acquisition.montantTravaux = 0;
    scenario.acquisition.fraisNotairePct = 0;
    scenario.acquisition.fraisNotaire = 0;
    scenario.acquisition.fraisAgence = 0;
    scenario.financement.montantPret = 50000;
    scenario.financement.tauxInteret = 0;
    scenario.financement.dureeMois = 120;
    scenario.financement.assuranceEmprunteurMensuelle = 0;
    scenario.charges.taxeFonciere = 0;
    scenario.charges.assurancePNO = 0;
    scenario.charges.assuranceLoyers = 0;
    scenario.charges.entretienCourant = 0;
    scenario.charges.grosEntretien = 0;
    scenario.charges.gestionLocative = 0;
    scenario.charges.comptabilite = 0;
    scenario.charges.copropriete = 0;
    scenario.charges.autresCharges = 0;
    scenario.hypotheses.tauxVacanceLD = 0;

    const result = calculerResultatsScenario(scenario);
    // Revenu: 1000 * 12 = 12000
    // Charges: 0
    // Financement: 50000 / 120 = 416.67€/mois = 5000€/an
    // Cash-flow: 12000 - 5000 = 7000€/an
    expect(result.cashFlowAnnuelAvantImpot).toBeCloseTo(7000, -1);
  });

  test('apportTotal includes notary fees when not financed', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = 100000;
    scenario.acquisition.fraisNotaire = 8000;
    scenario.acquisition.fraisAgenceInclus = false;
    scenario.acquisition.fraisAgence = 2000;
    scenario.apportPersonnel = 50000;

    const result = calculerResultatsScenario(scenario);
    // apportTotal = apportPersonnel + fraisNotaire + fraisAgence
    expect(result.apportTotal).toBeCloseTo(60000, 0);
  });
});

describe('comparerScenarios', () => {
  test('identifies best scenario correctly', () => {
    const scenarios = [creerScenarioLDTypique(), creerScenarioCDTypique()];
    const comparison = comparerScenarios(scenarios);

    expect(comparison.scenarios.length).toBe(2);
    expect(comparison.meilleurCashFlow).toBeTruthy();
    expect(comparison.meilleurRendementBrut).toBeTruthy();
    expect(comparison.meilleurRendementNet).toBeTruthy();
    expect(comparison.synthese).toBeTruthy();
  });

  test('single scenario comparison', () => {
    const scenarios = [creerScenarioLDTypique()];
    const comparison = comparerScenarios(scenarios);

    expect(comparison.scenarios.length).toBe(1);
    expect(comparison.meilleurCashFlow).toBe(comparison.scenarios[0].scenarioId);
    expect(comparison.meilleurRendementBrut).toBe(comparison.scenarios[0].scenarioId);
    expect(comparison.meilleurRendementNet).toBe(comparison.scenarios[0].scenarioId);
  });

  test('correctly identifies best cash-flow scenario', () => {
    const scenario1 = creerScenarioLDTypique();
    const scenario2 = creerScenarioLDTypique();

    // Make scenario2 have lower charges
    scenario2.charges.taxeFonciere = 1000; // Lower tax
    scenario1.charges.taxeFonciere = 5000; // Higher tax

    const comparison = comparerScenarios([scenario1, scenario2]);

    // scenario2 should have better cash-flow due to lower charges
    expect(comparison.meilleurCashFlow).toBe(comparison.scenarios[1].scenarioId);
  });
});

describe('Integration: Full scenario workflow', () => {
  test('empty scenario to complete calculation', () => {
    const scenario = creerScenarioVide('longue_duree');
    const result = calculerResultatsScenario(scenario);

    // Verify all key fields are populated
    expect(result.scenarioId).toBe(scenario.id);
    expect(result.revenuBrutAnnuel).toBeGreaterThanOrEqual(0);
    expect(result.investissementTotal).toBeGreaterThan(0);
    expect(result.chargesExploitationAnnuelles).toBeGreaterThanOrEqual(0);
    expect(result.chargeFinancementAnnuelle).toBeGreaterThanOrEqual(0);
    expect(result.rendementBrut).toBeGreaterThanOrEqual(0);
    expect(typeof result.rendementNet).toBe('number'); // Can be negative
  });

  test('multiple lots produce aggregated results', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.lots = [
      {
        ...creerLotVide(),
        id: 'lot-1',
        nom: 'Lot 1',
        loyerMensuelLD: 800,
      },
      {
        ...creerLotVide(),
        id: 'lot-2',
        nom: 'Lot 2',
        loyerMensuelLD: 1000,
      },
    ];

    const result = calculerResultatsScenario(scenario);
    expect(result.resultatsParLot.length).toBe(2);
    expect(result.revenuBrutAnnuel).toBeCloseTo(800 * 12 * 0.95 + 1000 * 12 * 0.95, 0);
  });
});
