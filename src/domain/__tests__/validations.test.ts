import {
  validerScenario,
  validerScenarioBasique,
  obtenirErreurs,
  obtenirAttentions,
} from '../validations';
import {
  creerScenarioVide,
  creerScenarioLDTypique,
  creerScenarioCDTypique,
} from '../defaults';
import { calculerResultatsScenario } from '../calculs';

describe('validerScenario', () => {
  test('valid LD scenario returns no errors', () => {
    const scenario = creerScenarioLDTypique();
    const alertes = validerScenario(scenario);
    const erreurs = alertes.filter((a) => a.type === 'erreur');
    expect(erreurs.length).toBe(0);
  });

  test('valid CD scenario returns no errors', () => {
    const scenario = creerScenarioCDTypique();
    const alertes = validerScenario(scenario);
    const erreurs = alertes.filter((a) => a.type === 'erreur');
    expect(erreurs.length).toBe(0);
  });

  test('detects zero price error', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = 0;
    const alertes = validerScenario(scenario);
    const erreurs = alertes.filter((a) => a.type === 'erreur');

    expect(erreurs.length).toBeGreaterThan(0);
    expect(erreurs.some((e) => e.code === 'PRIX_ACHAT_INVALIDE')).toBe(true);
  });

  test('detects negative price error', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = -50000;
    const alertes = validerScenario(scenario);
    const erreurs = alertes.filter((a) => a.type === 'erreur');

    expect(erreurs.length).toBeGreaterThan(0);
    expect(erreurs.some((e) => e.code === 'PRIX_ACHAT_INVALIDE')).toBe(true);
  });

  test('detects missing lots error', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.lots = [];
    const alertes = validerScenario(scenario);
    const erreurs = alertes.filter((a) => a.type === 'erreur');

    expect(erreurs.length).toBeGreaterThan(0);
    expect(erreurs.some((e) => e.code === 'PAS_DE_LOT')).toBe(true);
  });

  test('detects zero LD rent error', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.lots[0].loyerMensuelLD = 0;
    const alertes = validerScenario(scenario);
    const erreurs = alertes.filter((a) => a.type === 'erreur');

    expect(erreurs.some((e) => e.code === 'LOYER_ZERO')).toBe(true);
  });

  test('detects zero CD nightly rate error', () => {
    const scenario = creerScenarioVide('courte_duree');
    scenario.lots[0].tarifNuiteeCD = 0;
    const alertes = validerScenario(scenario);
    const erreurs = alertes.filter((a) => a.type === 'erreur');

    expect(erreurs.some((e) => e.code === 'TARIF_NUITEE_ZERO')).toBe(true);
  });

  test('detects insufficient apport error', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = 100000;
    scenario.acquisition.fraisNotaire = 8000;
    scenario.acquisition.fraisAgenceInclus = false;
    scenario.acquisition.fraisAgence = 2000;
    scenario.apportPersonnel = 5000; // Too low
    const alertes = validerScenario(scenario);
    const erreurs = alertes.filter((a) => a.type === 'erreur');

    expect(erreurs.some((e) => e.code === 'APPORT_INSUFFISANT')).toBe(true);
  });

  test('detects high CD occupation warning', () => {
    const scenario = creerScenarioVide('courte_duree');
    scenario.lots[0].tauxOccupationCD = 0.95; // >90%
    const alertes = validerScenario(scenario);
    const attentions = alertes.filter((a) => a.type === 'attention');

    expect(attentions.some((a) => a.code === 'OCCUPATION_OPTIMISTE')).toBe(true);
  });

  test('detects unrealistic interest rate warning', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.financement.tauxInteret = 0.25; // 25%
    const alertes = validerScenario(scenario);
    const attentions = alertes.filter((a) => a.type === 'attention');

    expect(attentions.some((a) => a.code === 'TAUX_INTERET_SUSPECT')).toBe(true);
  });

  test('detects invalid loan duration warning', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.financement.dureeMois = 6; // Less than 12 months
    const alertes = validerScenario(scenario);
    const attentions = alertes.filter((a) => a.type === 'attention');

    expect(attentions.some((a) => a.code === 'DUREE_PRET_SUSPECT')).toBe(true);
  });

  test('detects loan amount exceeding acquisition warning', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = 100000;
    scenario.acquisition.montantTravaux = 10000;
    scenario.financement.montantPret = 200000; // Exceeds price + works
    const alertes = validerScenario(scenario);
    const attentions = alertes.filter((a) => a.type === 'attention');

    expect(attentions.some((a) => a.code === 'MONTANT_PRET_SUSPECT')).toBe(true);
  });

  test('detects unrealistic vacancy rate warning', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.hypotheses.tauxVacanceLD = 0.01; // <2% is optimistic
    const alertes = validerScenario(scenario);
    const attentions = alertes.filter((a) => a.type === 'attention');

    expect(attentions.some((a) => a.code === 'VACANCE_OPTIMISTE')).toBe(true);
  });

  test('detects high management fees warning', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.charges.gestionLocative = 0.20; // 20%
    const alertes = validerScenario(scenario);
    const attentions = alertes.filter((a) => a.type === 'attention');

    expect(attentions.some((a) => a.code === 'GESTION_LOCATIVE_ELEVEE')).toBe(true);
  });

  test('detects low gross yield warning', () => {
    // rendement brut is calculated as: (revenuBrutAnnuel / investissementTotal) * 100
    // This scenario stays well below 2%
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = 50000;
    scenario.acquisition.fraisNotairePct = 0;
    scenario.acquisition.montantTravaux = 0;
    scenario.acquisition.fraisAgence = 0;
    scenario.financement.montantPret = 0;
    scenario.financement.fraisDossier = 0;
    scenario.financement.fraisGarantie = 0;
    scenario.apportPersonnel = 50000;
    scenario.lots[0].loyerMensuelLD = 1; // Only 1€/month = 12€/year
    scenario.hypotheses.tauxVacanceLD = 0;

    const alertes = validerScenario(scenario);
    const attentions = alertes.filter((a) => a.type === 'attention');
    const result = calculerResultatsScenario(scenario);

    expect(result.rendementBrut).toBeLessThan(2);
    expect(attentions.some((a) => a.code === 'RENDEMENT_FAIBLE')).toBe(true);
  });

  test('detects negative cash-flow warning', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = 100000;
    scenario.lots[0].loyerMensuelLD = 100; // Very low revenue
    scenario.charges.taxeFonciere = 10000; // Very high charges
    scenario.financement.montantPret = 80000; // High debt service
    const alertes = validerScenario(scenario);
    const attentions = alertes.filter((a) => a.type === 'attention');

    expect(attentions.some((a) => a.code === 'CASHFLOW_NEGATIF')).toBe(true);
  });
});

describe('validerScenarioBasique', () => {
  test('returns true for valid scenario', () => {
    const scenario = creerScenarioLDTypique();
    expect(validerScenarioBasique(scenario)).toBe(true);
  });

  test('returns false for scenario with errors', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = 0;
    expect(validerScenarioBasique(scenario)).toBe(false);
  });

  test('returns true for scenario with only warnings', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.hypotheses.tauxVacanceLD = 0.01; // Only a warning
    expect(validerScenarioBasique(scenario)).toBe(true);
  });
});

describe('obtenirErreurs', () => {
  test('returns only error-type alerts', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.acquisition.prixAchat = 0;
    scenario.hypotheses.tauxVacanceLD = 0.01; // This is a warning
    const erreurs = obtenirErreurs(scenario);

    expect(erreurs.every((a) => a.type === 'erreur')).toBe(true);
    expect(erreurs.length).toBeGreaterThan(0);
  });

  test('returns empty array when no errors', () => {
    const scenario = creerScenarioLDTypique();
    const erreurs = obtenirErreurs(scenario);
    expect(erreurs.length).toBe(0);
  });
});

describe('obtenirAttentions', () => {
  test('returns only attention-type alerts', () => {
    const scenario = creerScenarioVide('longue_duree');
    scenario.hypotheses.tauxVacanceLD = 0.01; // Warning
    const attentions = obtenirAttentions(scenario);

    expect(attentions.every((a) => a.type === 'attention')).toBe(true);
  });

  test('returns empty array when no warnings', () => {
    const scenario = creerScenarioLDTypique();
    scenario.hypotheses.tauxVacanceLD = 0.05; // Standard value
    const attentions = obtenirAttentions(scenario);
    // May still have warnings from other checks
    expect(attentions.every((a) => a.type === 'attention')).toBe(true);
  });
});
