/**
 * Default values for new simulations
 * Sensible defaults for French "immeubles de rapport"
 */

import {
  Simulation,
  Scenario,
  Lot,
  Financement,
  Charges,
  Acquisition,
  HypothesesExploitation,
  StrategyType,
  ImportAnnonceResult,
} from './types';

// ===== DEFAULT VALUES =====

const DEFAULTS = {
  // Notaire et frais
  fraisNotairePct: 0.08, // 8% (ancien)
  fraisGarance: 0.005, // 0.5% caution

  // Vacance et occupation
  tauxVacanceLD: 0.05, // 5%
  tauxOccupationCD: 0.65, // 65%

  // Gestion et commissions
  gestionLocative: 0.08, // 8%
  commissionPlateformeCD: 0.15, // 15%

  // Financement
  tauxInteret: 0.035, // 3.5%
  dureeMois: 240, // 20 ans
  assuranceEmprunteurPct: 0.003, // 0.3% annuel du capital = 0.025% mensuel

  // Charges courantes
  entretienCourant: 1500, // annuel
  grosEntretien: 2000, // provision annuelle
  taxeFonciere: 2500, // annuel
  assurancePNO: 600, // annuel
  assuranceLoyers: 450, // annuel GLI
  comptabilite: 500, // annuel

  // Revalorisation
  revalorisationLoyers: 0.02, // 2%
  revalorisationCharges: 0.02, // 2%

  // Fiscalité
  tauxImposition: 0.30, // 30% TMI
  dureeDetention: 10, // 10 ans
};

// ===== FACTORY FUNCTIONS =====

/**
 * Create an empty lot with sensible defaults
 */
export function creerLotVide(): Lot {
  return {
    id: `lot-${Date.now()}`,
    nom: 'Nouveau lot',
    surface: 50,
    type: 'T2',
    etage: 0,
    // Longue durée
    loyerMensuelLD: 800,
    chargesRecuperablesLD: 100,
    // Courte durée
    tarifNuiteeCD: 80,
    tauxOccupationCD: DEFAULTS.tauxOccupationCD,
    chargesMenageParNuitee: 15,
    chargesLingeParNuitee: 5,
    chargesConsommablesParNuitee: 3,
    commissionPlateformeCD: DEFAULTS.commissionPlateformeCD,
  };
}

/**
 * Create an empty financing structure with defaults
 */
export function creerFinancementVide(montantPret: number = 250000): Financement {
  const tauxMensuelParMois = DEFAULTS.assuranceEmprunteurPct / 12;
  const assuranceEmprunteurMensuelle = montantPret * tauxMensuelParMois;

  return {
    id: `financement-${Date.now()}`,
    nom: 'Financement principal',
    montantPret,
    tauxInteret: DEFAULTS.tauxInteret,
    dureeMois: DEFAULTS.dureeMois,
    differeMois: 0,
    typeAmortissement: 'constant',
    assuranceEmprunteurMensuelle,
    fraisDossier: 1500,
    fraisGarantie: montantPret * DEFAULTS.fraisGarance,
  };
}

/**
 * Create an empty charges structure with defaults
 */
export function creerChargesVides(): Charges {
  return {
    taxeFonciere: DEFAULTS.taxeFonciere,
    assurancePNO: DEFAULTS.assurancePNO,
    assuranceLoyers: DEFAULTS.assuranceLoyers,
    entretienCourant: DEFAULTS.entretienCourant,
    grosEntretien: DEFAULTS.grosEntretien,
    gestionLocative: DEFAULTS.gestionLocative,
    comptabilite: DEFAULTS.comptabilite,
    copropriete: 1500, // Charges non récupérables annuelles
    cfe: 500, // CFE si courte durée
    autresCharges: 0,
    descriptionAutres: '',
  };
}

/**
 * Create an empty acquisition structure with defaults
 */
export function creerAcquisitionVide(prixAchat: number = 300000): Acquisition {
  return {
    prixAchat,
    fraisNotaire: 0, // Will be calculated from pct
    fraisNotairePct: DEFAULTS.fraisNotairePct,
    fraisAgence: 0,
    fraisAgenceInclus: true, // FAI par défaut
    montantTravaux: 10000,
    detailTravaux: '',
    montantAmeublement: 0,
    autresFrais: 0,
    descriptionAutresFrais: '',
  };
}

/**
 * Create exploitation hypotheses with defaults
 */
export function creerHypothesesVides(): HypothesesExploitation {
  return {
    tauxVacanceLD: DEFAULTS.tauxVacanceLD,
    revalorisationLoyersAnnuelle: DEFAULTS.revalorisationLoyers,
    revalorisationChargesAnnuelle: DEFAULTS.revalorisationCharges,
    dureeDetention: DEFAULTS.dureeDetention,
    tauxImposition: DEFAULTS.tauxImposition,
    regimeFiscal: 'reel',
  };
}

/**
 * Create an empty scenario with sensible defaults
 */
export function creerScenarioVide(strategie: StrategyType = 'longue_duree'): Scenario {
  const montantPretDefaut = 250000;

  return {
    id: `scenario-${Date.now()}`,
    nom: `Scénario ${strategie === 'longue_duree' ? 'Longue durée' : 'Courte durée'}`,
    strategie,
    lots: [creerLotVide()],
    financement: creerFinancementVide(montantPretDefaut),
    charges: creerChargesVides(),
    acquisition: creerAcquisitionVide(),
    hypotheses: creerHypothesesVides(),
    apportPersonnel: 100000,
  };
}

/**
 * Create an empty simulation with defaults
 */
export function creerSimulationVide(): Simulation {
  const now = new Date().toISOString();

  return {
    id: `sim-${Date.now()}`,
    nom: 'Nouvelle simulation',
    description: '',
    adresse: '',
    ville: '',
    codePostal: '',
    dateCreation: now,
    dateMiseAJour: now,
    scenarios: [creerScenarioVide('longue_duree')],
  };
}

// ===== PRESET SCENARIOS =====

/**
 * Create a typical long-term rental scenario (LD)
 * Small apartment building, standard financing
 */
export function creerScenarioLDTypique(): Scenario {
  const scenario = creerScenarioVide('longue_duree');

  // 2 apartments
  scenario.lots = [
    {
      ...creerLotVide(),
      id: 'lot-1',
      nom: 'Appartement T2 RDC',
      surface: 55,
      etage: 0,
      loyerMensuelLD: 750,
      chargesRecuperablesLD: 80,
    },
    {
      ...creerLotVide(),
      id: 'lot-2',
      nom: 'Appartement T3 1er',
      surface: 75,
      etage: 1,
      loyerMensuelLD: 950,
      chargesRecuperablesLD: 100,
    },
  ];

  // Standard financing
  scenario.financement = {
    ...creerFinancementVide(300000),
    nom: 'Crédit principal',
    montantPret: 300000,
    tauxInteret: 0.035,
    dureeMois: 240,
  };

  // Standard charges
  scenario.charges = {
    ...creerChargesVides(),
    taxeFonciere: 3000,
    copropriete: 2500,
  };

  scenario.acquisition = {
    ...creerAcquisitionVide(375000),
    prixAchat: 375000,
    montantTravaux: 15000,
  };

  scenario.apportPersonnel = 100000;
  scenario.hypotheses.tauxVacanceLD = 0.05;

  return scenario;
}

/**
 * Create a typical short-term rental scenario (CD / Airbnb)
 */
export function creerScenarioCDTypique(): Scenario {
  const scenario = creerScenarioVide('courte_duree');

  // 3 studios optimized for short-term
  scenario.lots = [
    {
      ...creerLotVide(),
      id: 'lot-1',
      nom: 'Studio 1',
      surface: 30,
      etage: 0,
      tarifNuiteeCD: 75,
      tauxOccupationCD: 0.65,
      chargesMenageParNuitee: 20,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.15,
    },
    {
      ...creerLotVide(),
      id: 'lot-2',
      nom: 'Studio 2',
      surface: 32,
      etage: 1,
      tarifNuiteeCD: 80,
      tauxOccupationCD: 0.65,
      chargesMenageParNuitee: 20,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.15,
    },
    {
      ...creerLotVide(),
      id: 'lot-3',
      nom: 'Studio 3',
      surface: 30,
      etage: 2,
      tarifNuiteeCD: 70,
      tauxOccupationCD: 0.65,
      chargesMenageParNuitee: 20,
      chargesLingeParNuitee: 5,
      chargesConsommablesParNuitee: 3,
      commissionPlateformeCD: 0.15,
    },
  ];

  scenario.financement = creerFinancementVide(280000);
  scenario.acquisition = {
    ...creerAcquisitionVide(350000),
    prixAchat: 350000,
    montantTravaux: 20000,
    montantAmeublement: 8000, // CD needs furniture
  };

  scenario.charges = {
    ...creerChargesVides(),
    cfe: 1200, // CFE for commercial use
    copropriete: 2000,
  };

  scenario.apportPersonnel = 120000;

  return scenario;
}

// ===== PRESET BEAUVAIS (60000) =====
// Données marché locatif Beauvais — Sources : MeilleursAgents, Kazba, LocService, Likibu, impots-locaux.org
// Taux communal TF : 57.20% (bien supérieur à la moyenne Oise 42.63%)
// DMTO Oise : 4.5% (pas d'augmentation 2025) → frais notaire ~7.5%
// Prix m² immeuble de rapport : 1 200 - 1 800 €/m²
// Vacance effective : 5-6% pour bien entretenu et bien placé (9.6% global ville)
// Forte proportion de locataires (47%), population jeune (40% < 30 ans), 13% étudiants

const DEFAULTS_BEAUVAIS = {
  // Notaire — Oise n'a pas augmenté les DMTO (4.5%), frais notaire réduits vs. national
  fraisNotairePct: 0.075, // 7.5%
  fraisGarance: 0.005,

  // Vacance et occupation — marché dynamique mais revenus modestes
  tauxVacanceLD: 0.06, // 6% — vacance effective pour bien correct
  tauxOccupationCD: 0.50, // 50% — ville secondaire, trafic aéroport Paris-Beauvais

  // Gestion et commissions
  gestionLocative: 0.08, // 8%
  commissionPlateformeCD: 0.15, // 15%

  // Financement
  tauxInteret: 0.035,
  dureeMois: 240,
  assuranceEmprunteurPct: 0.003,

  // Charges courantes — TF très élevée à Beauvais (taux communal 57.20%)
  entretienCourant: 2000, // annuel — bâti ancien, entretien plus fréquent
  grosEntretien: 2500, // provision annuelle
  taxeFonciere: 4000, // annuel — taux communal 57.20% bien au-dessus de la moyenne
  assurancePNO: 650, // annuel
  assuranceLoyers: 500, // annuel GLI
  comptabilite: 500, // annuel
  copropriete: 0, // monopropriété typique pour immeuble de rapport
  cfe: 500, // CFE par lot si meublé

  // Revalorisation
  revalorisationLoyers: 0.015, // 1.5% — marché modéré
  revalorisationCharges: 0.02, // 2%

  // Fiscalité
  tauxImposition: 0.30,
  dureeDetention: 10,
};

/**
 * Immeuble de rapport Beauvais — Longue durée (4 lots)
 * Immeuble typique centre-ville ancien, monopropriété
 * Prix ~250 000 €, loyers ~2 150 €/mois, rendement brut ~10%
 */
export function creerScenarioBeauvaisLD(): Scenario {
  const prixAchat = 250000; // ~1 500 €/m² pour 170m² total
  const montantPret = 225000;

  return {
    id: `scenario-${Date.now()}`,
    nom: 'Beauvais — Longue durée',
    strategie: 'longue_duree',
    lots: [
      {
        ...creerLotVide(),
        id: `lot-${Date.now()}-0`,
        nom: 'Studio RDC',
        surface: 25,
        type: 'Studio',
        etage: 0,
        loyerMensuelLD: 380, // Loyer moyen studio Beauvais
        chargesRecuperablesLD: 50,
        tarifNuiteeCD: 55,
        tauxOccupationCD: DEFAULTS_BEAUVAIS.tauxOccupationCD,
        chargesMenageParNuitee: 15,
        chargesLingeParNuitee: 5,
        chargesConsommablesParNuitee: 3,
        commissionPlateformeCD: DEFAULTS_BEAUVAIS.commissionPlateformeCD,
      },
      {
        ...creerLotVide(),
        id: `lot-${Date.now()}-1`,
        nom: 'T2 1er étage',
        surface: 42,
        type: 'T2',
        etage: 1,
        loyerMensuelLD: 580, // Loyer moyen T2 Beauvais
        chargesRecuperablesLD: 70,
        tarifNuiteeCD: 80,
        tauxOccupationCD: DEFAULTS_BEAUVAIS.tauxOccupationCD,
        chargesMenageParNuitee: 20,
        chargesLingeParNuitee: 5,
        chargesConsommablesParNuitee: 3,
        commissionPlateformeCD: DEFAULTS_BEAUVAIS.commissionPlateformeCD,
      },
      {
        ...creerLotVide(),
        id: `lot-${Date.now()}-2`,
        nom: 'T2 bis 2ème étage',
        surface: 48,
        type: 'T2',
        etage: 2,
        loyerMensuelLD: 620, // T2 bis légèrement plus grand
        chargesRecuperablesLD: 75,
        tarifNuiteeCD: 85,
        tauxOccupationCD: DEFAULTS_BEAUVAIS.tauxOccupationCD,
        chargesMenageParNuitee: 20,
        chargesLingeParNuitee: 5,
        chargesConsommablesParNuitee: 3,
        commissionPlateformeCD: DEFAULTS_BEAUVAIS.commissionPlateformeCD,
      },
      {
        ...creerLotVide(),
        id: `lot-${Date.now()}-3`,
        nom: 'T3 3ème étage',
        surface: 55,
        type: 'T3',
        etage: 3,
        loyerMensuelLD: 720, // Loyer moyen T3 Beauvais
        chargesRecuperablesLD: 90,
        tarifNuiteeCD: 100,
        tauxOccupationCD: DEFAULTS_BEAUVAIS.tauxOccupationCD,
        chargesMenageParNuitee: 25,
        chargesLingeParNuitee: 8,
        chargesConsommablesParNuitee: 5,
        commissionPlateformeCD: DEFAULTS_BEAUVAIS.commissionPlateformeCD,
      },
    ],
    financement: {
      ...creerFinancementVide(montantPret),
      nom: 'Crédit Beauvais LD',
      montantPret,
      tauxInteret: DEFAULTS_BEAUVAIS.tauxInteret,
      dureeMois: DEFAULTS_BEAUVAIS.dureeMois,
    },
    charges: {
      taxeFonciere: DEFAULTS_BEAUVAIS.taxeFonciere,
      assurancePNO: DEFAULTS_BEAUVAIS.assurancePNO,
      assuranceLoyers: DEFAULTS_BEAUVAIS.assuranceLoyers,
      entretienCourant: DEFAULTS_BEAUVAIS.entretienCourant,
      grosEntretien: DEFAULTS_BEAUVAIS.grosEntretien,
      gestionLocative: DEFAULTS_BEAUVAIS.gestionLocative,
      comptabilite: DEFAULTS_BEAUVAIS.comptabilite,
      copropriete: DEFAULTS_BEAUVAIS.copropriete,
      cfe: 0, // Pas de CFE en location nue
      autresCharges: 0,
      descriptionAutres: '',
    },
    acquisition: {
      ...creerAcquisitionVide(prixAchat),
      prixAchat,
      fraisNotairePct: DEFAULTS_BEAUVAIS.fraisNotairePct,
      montantTravaux: 20000, // Rafraîchissement bâti ancien
      detailTravaux: 'Rafraîchissement parties communes, peintures, petite remise aux normes',
    },
    hypotheses: {
      tauxVacanceLD: DEFAULTS_BEAUVAIS.tauxVacanceLD,
      revalorisationLoyersAnnuelle: DEFAULTS_BEAUVAIS.revalorisationLoyers,
      revalorisationChargesAnnuelle: DEFAULTS_BEAUVAIS.revalorisationCharges,
      dureeDetention: DEFAULTS_BEAUVAIS.dureeDetention,
      tauxImposition: DEFAULTS_BEAUVAIS.tauxImposition,
      regimeFiscal: 'reel',
    },
    apportPersonnel: prixAchat - montantPret + 20000, // 25 000 + travaux
  };
}

/**
 * Immeuble de rapport Beauvais — Courte durée (3 studios Airbnb)
 * Studios optimisés transit aéroport Paris-Beauvais
 * Taux occupation 50%, nuitée moyenne 55-65 €
 */
export function creerScenarioBeauvaisCD(): Scenario {
  const prixAchat = 200000; // 3 studios ~75m² total, ~2 650 €/m²
  const montantPret = 180000;

  return {
    id: `scenario-${Date.now()}-cd`,
    nom: 'Beauvais — Courte durée (Airbnb)',
    strategie: 'courte_duree',
    lots: [
      {
        ...creerLotVide(),
        id: `lot-${Date.now()}-0`,
        nom: 'Studio 1 RDC',
        surface: 25,
        type: 'Studio',
        etage: 0,
        loyerMensuelLD: 380,
        chargesRecuperablesLD: 50,
        tarifNuiteeCD: 55, // Entrée de gamme transit aéroport
        tauxOccupationCD: DEFAULTS_BEAUVAIS.tauxOccupationCD,
        chargesMenageParNuitee: 18,
        chargesLingeParNuitee: 5,
        chargesConsommablesParNuitee: 3,
        commissionPlateformeCD: DEFAULTS_BEAUVAIS.commissionPlateformeCD,
      },
      {
        ...creerLotVide(),
        id: `lot-${Date.now()}-1`,
        nom: 'Studio 2 1er étage',
        surface: 25,
        type: 'Studio',
        etage: 1,
        loyerMensuelLD: 380,
        chargesRecuperablesLD: 50,
        tarifNuiteeCD: 58,
        tauxOccupationCD: DEFAULTS_BEAUVAIS.tauxOccupationCD,
        chargesMenageParNuitee: 18,
        chargesLingeParNuitee: 5,
        chargesConsommablesParNuitee: 3,
        commissionPlateformeCD: DEFAULTS_BEAUVAIS.commissionPlateformeCD,
      },
      {
        ...creerLotVide(),
        id: `lot-${Date.now()}-2`,
        nom: 'Studio 3 2ème étage',
        surface: 28,
        type: 'Studio',
        etage: 2,
        loyerMensuelLD: 400,
        chargesRecuperablesLD: 55,
        tarifNuiteeCD: 62, // Légèrement plus grand
        tauxOccupationCD: DEFAULTS_BEAUVAIS.tauxOccupationCD,
        chargesMenageParNuitee: 18,
        chargesLingeParNuitee: 5,
        chargesConsommablesParNuitee: 3,
        commissionPlateformeCD: DEFAULTS_BEAUVAIS.commissionPlateformeCD,
      },
    ],
    financement: {
      ...creerFinancementVide(montantPret),
      nom: 'Crédit Beauvais CD',
      montantPret,
      tauxInteret: DEFAULTS_BEAUVAIS.tauxInteret,
      dureeMois: DEFAULTS_BEAUVAIS.dureeMois,
    },
    charges: {
      taxeFonciere: 3200, // 3 studios, TF élevée Beauvais
      assurancePNO: DEFAULTS_BEAUVAIS.assurancePNO,
      assuranceLoyers: 0, // Pas de GLI en courte durée
      entretienCourant: DEFAULTS_BEAUVAIS.entretienCourant,
      grosEntretien: DEFAULTS_BEAUVAIS.grosEntretien,
      gestionLocative: 0, // Gestion directe typique en CD
      comptabilite: 800, // Comptabilité LMNP plus complexe
      copropriete: DEFAULTS_BEAUVAIS.copropriete,
      cfe: 1500, // 500 €/lot × 3 lots
      autresCharges: 600, // Wifi, Netflix, consommables communs
      descriptionAutres: 'Wifi fibre, abonnements streaming, consommables',
    },
    acquisition: {
      ...creerAcquisitionVide(prixAchat),
      prixAchat,
      fraisNotairePct: DEFAULTS_BEAUVAIS.fraisNotairePct,
      montantTravaux: 15000,
      detailTravaux: 'Aménagement studios, décoration, petits travaux',
      montantAmeublement: 9000, // 3 000 €/studio — mobilier + équipement
    },
    hypotheses: {
      tauxVacanceLD: DEFAULTS_BEAUVAIS.tauxVacanceLD,
      revalorisationLoyersAnnuelle: DEFAULTS_BEAUVAIS.revalorisationLoyers,
      revalorisationChargesAnnuelle: DEFAULTS_BEAUVAIS.revalorisationCharges,
      dureeDetention: DEFAULTS_BEAUVAIS.dureeDetention,
      tauxImposition: DEFAULTS_BEAUVAIS.tauxImposition,
      regimeFiscal: 'lmnp_reel', // LMNP réel pour amortissements
    },
    apportPersonnel: prixAchat - montantPret + 24000, // Apport + travaux + ameublement
  };
}

/**
 * Simulation complète Beauvais avec les 2 scénarios (LD + CD) pour comparaison
 */
export function creerSimulationBeauvais(): Simulation {
  const now = new Date().toISOString();

  return {
    id: `sim-${Date.now()}`,
    nom: 'Immeuble de rapport — Beauvais',
    description: 'Simulation calibrée marché Beauvais (60000). TF élevée (taux 57%), frais notaire 7.5% (Oise), forte demande locative (47% locataires, 13% étudiants).',
    adresse: '',
    ville: 'Beauvais',
    codePostal: '60000',
    dateCreation: now,
    dateMiseAJour: now,
    scenarios: [creerScenarioBeauvaisLD(), creerScenarioBeauvaisCD()],
  };
}

export { DEFAULTS_BEAUVAIS };

// ===== IMPORT FROM ANNONCE =====

/**
 * Tarifs nuitée CD par type de lot — marché Beauvais (aéroport Paris-Beauvais)
 */
const TARIF_NUITEE_BEAUVAIS: Record<string, number> = {
  'Studio': 55,
  'T1': 60,
  'T2': 85,
  'T3': 100,
  'T4': 120,
  'T5': 140,
};

/** Loyers LD par type de lot — marché Beauvais */
const LOYER_LD_BEAUVAIS: Record<string, number> = {
  'Studio': 380,
  'T1': 420,
  'T2': 600,
  'T3': 720,
  'T4': 900,
  'T5': 1050,
};

/** Charges ménage CD par type de lot */
const CHARGES_MENAGE_BEAUVAIS: Record<string, number> = {
  'Studio': 18,
  'T1': 18,
  'T2': 22,
  'T3': 28,
  'T4': 35,
  'T5': 40,
};

function isBeauvais(ville: string | null, codePostal: string | null): boolean {
  if (codePostal === '60000') return true;
  if (!ville) return false;
  return ville.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('beauvais');
}

/**
 * Create a full Simulation from OpenAI-extracted data.
 * Generates both LD and CD scenarios for comparison.
 * Uses Beauvais-specific defaults when the city is detected as Beauvais.
 */
export function creerSimulationDepuisImport(data: ImportAnnonceResult): Simulation {
  const now = new Date().toISOString();
  const prixAchat = data.prixAchat ?? 300000;
  const beauvais = isBeauvais(data.ville, data.codePostal);
  const d = beauvais ? DEFAULTS_BEAUVAIS : DEFAULTS;

  // Build lots from extracted data with proper market values
  const lots: Lot[] =
    data.lots.length > 0
      ? data.lots.map((importLot, i) => {
          const base = creerLotVide();
          const type = importLot.type ?? 'T2';
          const loyerLD = importLot.loyerMensuel
            ?? (beauvais ? (LOYER_LD_BEAUVAIS[type] ?? 600) : base.loyerMensuelLD);
          const tarifCD = beauvais ? (TARIF_NUITEE_BEAUVAIS[type] ?? 70) : base.tarifNuiteeCD;
          const menage = beauvais ? (CHARGES_MENAGE_BEAUVAIS[type] ?? 20) : base.chargesMenageParNuitee;
          const etageLabel = importLot.etage != null
            ? (importLot.etage === 0 ? 'RDC' : `${importLot.etage}${importLot.etage === 1 ? 'er' : 'ème'} étage`)
            : '';

          return {
            ...base,
            id: `lot-${Date.now()}-${i}`,
            nom: `${type} ${etageLabel}`.trim(),
            surface: importLot.surface ?? base.surface,
            type,
            etage: importLot.etage ?? base.etage,
            loyerMensuelLD: loyerLD,
            chargesRecuperablesLD: Math.round(loyerLD * 0.12), // ~12% du loyer
            tarifNuiteeCD: tarifCD,
            tauxOccupationCD: d.tauxOccupationCD,
            chargesMenageParNuitee: menage,
            chargesLingeParNuitee: 5,
            chargesConsommablesParNuitee: 3,
            commissionPlateformeCD: d.commissionPlateformeCD,
          };
        })
      : [creerLotVide()];

  // Shared acquisition (same for both scenarios)
  const acquisition: Acquisition = {
    ...creerAcquisitionVide(prixAchat),
    fraisNotairePct: beauvais ? DEFAULTS_BEAUVAIS.fraisNotairePct : DEFAULTS.fraisNotairePct,
    fraisAgence: data.fraisAgence ?? 0,
    fraisAgenceInclus: data.fraisAgenceInclus ?? true,
    montantTravaux: data.montantTravaux ?? 10000,
    detailTravaux: data.detailTravaux ?? '',
  };

  // Financement
  const montantPret = Math.round(prixAchat * 0.9);

  // Hypothèses communes
  const hypothesesLD: HypothesesExploitation = {
    tauxVacanceLD: d.tauxVacanceLD,
    revalorisationLoyersAnnuelle: beauvais ? d.revalorisationLoyers : DEFAULTS.revalorisationLoyers,
    revalorisationChargesAnnuelle: beauvais ? d.revalorisationCharges : DEFAULTS.revalorisationCharges,
    dureeDetention: d.dureeDetention,
    tauxImposition: d.tauxImposition,
    regimeFiscal: 'reel',
  };

  const hypothesesCD: HypothesesExploitation = {
    ...hypothesesLD,
    regimeFiscal: 'lmnp_reel',
  };

  // === Scénario Longue Durée ===
  const scenarioLD: Scenario = {
    id: `scenario-${Date.now()}-ld`,
    nom: 'Longue durée',
    strategie: 'longue_duree',
    lots: lots.map(l => ({ ...l })), // deep copy
    financement: { ...creerFinancementVide(montantPret), nom: 'Crédit LD' },
    charges: {
      taxeFonciere: data.taxeFonciere ?? (beauvais ? d.taxeFonciere : DEFAULTS.taxeFonciere),
      assurancePNO: beauvais ? d.assurancePNO : DEFAULTS.assurancePNO,
      assuranceLoyers: beauvais ? d.assuranceLoyers : DEFAULTS.assuranceLoyers,
      entretienCourant: beauvais ? d.entretienCourant : DEFAULTS.entretienCourant,
      grosEntretien: beauvais ? d.grosEntretien : DEFAULTS.grosEntretien,
      gestionLocative: d.gestionLocative,
      comptabilite: d.comptabilite,
      copropriete: data.copropriete ?? (beauvais ? 0 : 1500),
      cfe: 0, // Pas de CFE en location nue
      autresCharges: 0,
      descriptionAutres: '',
    },
    acquisition: { ...acquisition },
    hypotheses: hypothesesLD,
    apportPersonnel: prixAchat - montantPret,
  };

  // === Scénario Courte Durée ===
  const nbLots = lots.length;
  const scenarioCD: Scenario = {
    id: `scenario-${Date.now()}-cd`,
    nom: 'Courte durée (Airbnb)',
    strategie: 'courte_duree',
    lots: lots.map(l => ({ ...l })), // deep copy
    financement: { ...creerFinancementVide(montantPret), nom: 'Crédit CD' },
    charges: {
      taxeFonciere: data.taxeFonciere ?? (beauvais ? d.taxeFonciere : DEFAULTS.taxeFonciere),
      assurancePNO: beauvais ? d.assurancePNO : DEFAULTS.assurancePNO,
      assuranceLoyers: 0, // Pas de GLI en courte durée
      entretienCourant: beauvais ? d.entretienCourant : DEFAULTS.entretienCourant,
      grosEntretien: beauvais ? d.grosEntretien : DEFAULTS.grosEntretien,
      gestionLocative: 0, // Gestion directe typique en CD
      comptabilite: beauvais ? 800 : 700, // Compta LMNP plus complexe
      copropriete: data.copropriete ?? (beauvais ? 0 : 1500),
      cfe: (beauvais ? DEFAULTS_BEAUVAIS.cfe : 500) * nbLots,
      autresCharges: nbLots * 200, // Wifi, consommables par lot
      descriptionAutres: 'Wifi fibre, consommables, petites fournitures',
    },
    acquisition: {
      ...acquisition,
      montantAmeublement: nbLots * 3000, // 3 000 €/lot pour meubles + équipement
    },
    hypotheses: hypothesesCD,
    apportPersonnel: prixAchat - montantPret + nbLots * 3000,
  };

  // Build a name from address or fallback
  const nomParts = [data.adresse, data.ville].filter(Boolean);
  const nom = nomParts.length > 0 ? nomParts.join(', ') : 'Import annonce';

  return {
    id: `sim-${Date.now()}`,
    nom,
    description: data.description ?? '',
    adresse: data.adresse ?? '',
    ville: data.ville ?? '',
    codePostal: data.codePostal ?? '',
    dateCreation: now,
    dateMiseAJour: now,
    scenarios: [scenarioLD, scenarioCD],
  };
}

// ===== EXPORT DEFAULTS OBJECT =====

export { DEFAULTS };
