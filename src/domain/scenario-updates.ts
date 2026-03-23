import { DEFAULTS } from './defaults';
import { Acquisition, Financement, Scenario } from './types';

function calculerFraisNotaire(acquisition: Acquisition): number {
  return acquisition.fraisNotaire > 0
    ? acquisition.fraisNotaire
    : acquisition.prixAchat * acquisition.fraisNotairePct;
}

function estDifferent<T>(current: T, next: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(next);
}

export function calculerMontantPretRecommande(
  acquisition: Acquisition,
  apportPersonnel: number
): number {
  const fraisNotaire = calculerFraisNotaire(acquisition);

  const investissementAFinancer =
    acquisition.prixAchat +
    fraisNotaire +
    (acquisition.fraisAgenceInclus ? 0 : acquisition.fraisAgence) +
    acquisition.montantTravaux +
    acquisition.montantAmeublement;

  return Math.max(0, Math.round(investissementAFinancer - apportPersonnel));
}

export function synchroniserFinancementAvecProjet(
  financement: Financement,
  acquisition: Acquisition,
  apportPersonnel: number
): Financement {
  const montantPret = calculerMontantPretRecommande(acquisition, apportPersonnel);
  const assuranceEmprunteurMensuelle = Math.round(
    montantPret * (DEFAULTS.assuranceEmprunteurPct / 12)
  );
  const fraisGarantie = Math.round(montantPret * DEFAULTS.fraisGarance);

  return {
    ...financement,
    montantPret,
    assuranceEmprunteurMensuelle,
    fraisGarantie,
  };
}

export function harmoniserScenarioApresEdition(
  currentScenario: Scenario,
  nextScenario: Scenario
): Scenario {
  const acquisitionChanged = estDifferent(
    currentScenario.acquisition,
    nextScenario.acquisition
  );
  const apportChanged =
    currentScenario.apportPersonnel !== nextScenario.apportPersonnel;
  const financementChanged = estDifferent(
    currentScenario.financement,
    nextScenario.financement
  );

  if ((acquisitionChanged || apportChanged) && !financementChanged) {
    return {
      ...nextScenario,
      financement: synchroniserFinancementAvecProjet(
        nextScenario.financement,
        nextScenario.acquisition,
        nextScenario.apportPersonnel
      ),
    };
  }

  return nextScenario;
}
