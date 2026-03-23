// Core types for the real estate simulation engine
// Specialized for French "immeubles de rapport" (multi-unit rental buildings)

export type StrategyType = 'longue_duree' | 'courte_duree';

export interface Lot {
  id: string;
  nom: string; // ex: "Appartement T2 RDC"
  surface: number; // m²
  type: string; // T1, T2, T3, studio, commerce, etc.
  etage: number;
  // Longue durée
  loyerMensuelLD: number; // loyer charges comprises en LD
  chargesRecuperablesLD: number; // charges récupérables sur le locataire
  // Courte durée
  tarifNuiteeCD: number; // prix moyen par nuit
  tauxOccupationCD: number; // 0-1, taux d'occupation moyen annuel
  chargesMenageParNuitee: number; // ménage par rotation
  chargesLingeParNuitee: number;
  chargesConsommablesParNuitee: number;
  commissionPlateformeCD: number; // % commission (ex: 0.15 pour 15%)
}

export interface Financement {
  id: string;
  nom: string;
  montantPret: number;
  tauxInteret: number; // annuel, ex: 0.035 pour 3.5%
  dureeMois: number; // durée en mois
  differeMois: number; // différé en mois (0 si pas de différé)
  typeAmortissement: 'constant' | 'lineaire'; // constant = annuités constantes
  assuranceEmprunteurMensuelle: number;
  fraisDossier: number;
  fraisGarantie: number; // hypothèque ou caution
}

export interface Charges {
  taxeFonciere: number; // annuelle
  assurancePNO: number; // annuelle (propriétaire non occupant)
  assuranceLoyers: number; // annuelle (GLI ou équivalent)
  entretienCourant: number; // annuel
  grosEntretien: number; // provision annuelle
  gestionLocative: number; // % des loyers bruts, 0-1
  comptabilite: number; // annuel
  copropriete: number; // charges non récupérables annuelles
  cfe: number; // cotisation foncière des entreprises (si LCD)
  autresCharges: number; // annuel
  descriptionAutres: string;
}

export interface Acquisition {
  prixAchat: number;
  fraisNotaire: number; // montant ou calculé
  fraisNotairePct: number; // % du prix, pour calcul auto (ex: 0.08)
  fraisAgence: number;
  fraisAgenceInclus: boolean; // FAI ou hors frais
  montantTravaux: number;
  detailTravaux: string;
  montantAmeublement: number; // pour LCD principalement
  autresFrais: number;
  descriptionAutresFrais: string;
}

export interface HypothesesExploitation {
  tauxVacanceLD: number; // 0-1, ex: 0.05 pour 5%
  revalorisationLoyersAnnuelle: number; // ex: 0.02 pour 2%
  revalorisationChargesAnnuelle: number; // ex: 0.02
  dureeDetention: number; // en années, pour projections
  tauxImposition: number; // tranche marginale TMI
  regimeFiscal: 'micro_foncier' | 'reel' | 'lmnp_micro' | 'lmnp_reel';
}

export interface Scenario {
  id: string;
  nom: string;
  strategie: StrategyType;
  lots: Lot[];
  financement: Financement;
  charges: Charges;
  acquisition: Acquisition;
  hypotheses: HypothesesExploitation;
  apportPersonnel: number;
}

export interface Simulation {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  ville: string;
  codePostal: string;
  dateCreation: string; // ISO
  dateMiseAJour: string; // ISO
  scenarios: Scenario[];
}

// ===== RÉSULTATS CALCULÉS =====

export interface ResultatsLot {
  lotId: string;
  revenuBrutAnnuel: number;
  revenuBrutMensuel: number;
  chargesExploitationLotAnnuel: number; // charges spécifiques au lot (ménage, linge, plateforme pour LCD)
  revenuNetLotAnnuel: number;
}

export interface ResultatsFinancement {
  mensualiteHorsAssurance: number;
  mensualiteAvecAssurance: number;
  coutTotalCredit: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  tableauAmortissement: LigneAmortissement[];
}

export interface LigneAmortissement {
  mois: number;
  capitalRestant: number;
  mensualite: number;
  partCapital: number;
  partInterets: number;
  assurance: number;
}

export interface ResultatsScenario {
  scenarioId: string;
  scenarioNom: string;
  strategie: StrategyType;

  // Investissement total
  investissementTotal: number; // prix + notaire + agence + travaux + ameublement + frais financement
  apportTotal: number; // apport + frais non financés

  // Revenus
  revenuBrutAnnuel: number;
  revenuBrutMensuel: number;
  resultatsParLot: ResultatsLot[];

  // Charges
  chargesExploitationAnnuelles: number;
  chargesExploitationMensuelles: number;
  detailCharges: {
    taxeFonciere: number;
    assurances: number;
    entretien: number;
    gestionLocative: number;
    comptabilite: number;
    copropriete: number;
    cfe: number;
    chargesLotsCourtesDuree: number; // ménage, linge, consommables, plateformes
    autresCharges: number;
  };

  // Financement
  financement: ResultatsFinancement;
  chargeFinancementMensuelle: number;
  chargeFinancementAnnuelle: number;

  // Cash-flow
  cashFlowMensuelAvantImpot: number;
  cashFlowAnnuelAvantImpot: number;

  // Rendements
  rendementBrut: number; // revenus bruts / investissement total
  rendementNet: number; // (revenus - charges exploitation) / investissement total
  rendementNetNet: number; // (revenus - charges - financement) / investissement total
  cashOnCash: number; // cash-flow / apport personnel (retour sur fonds propres)

  // Alertes
  alertes: AlerteMetier[];
}

export interface AlerteMetier {
  type: 'erreur' | 'attention' | 'info';
  code: string;
  message: string;
  details?: string;
}

export interface ComparaisonScenarios {
  scenarios: ResultatsScenario[];
  meilleurCashFlow: string; // scenarioId
  meilleurRendementBrut: string;
  meilleurRendementNet: string;
  synthese: string;
}

// ===== IMPORT ANNONCE =====

export interface ImportAnnonceLot {
  type: string | null; // T1, T2, T3, Studio, Commerce...
  surface: number | null; // m²
  etage: number | null;
  loyerMensuel: number | null; // loyer si mentionné
}

export interface ImportAnnonceResult {
  // Immeuble
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
  description: string | null;
  // Acquisition
  prixAchat: number | null;
  fraisAgence: number | null;
  fraisAgenceInclus: boolean | null; // FAI ou net vendeur
  montantTravaux: number | null;
  detailTravaux: string | null;
  // Lots
  lots: ImportAnnonceLot[];
  // Charges
  taxeFonciere: number | null;
  copropriete: number | null;
  // Stratégie détectée
  strategie: StrategyType | null; // détection meublé/nu → longue/courte durée
}
