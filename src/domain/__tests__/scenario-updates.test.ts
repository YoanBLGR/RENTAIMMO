import { creerScenarioVide } from '../defaults';
import {
  calculerMontantPretRecommande,
  harmoniserScenarioApresEdition,
} from '../scenario-updates';

describe('scenario updates', () => {
  test('calculates the recommended loan amount from acquisition and deposit', () => {
    const scenario = creerScenarioVide('longue_duree');

    expect(
      calculerMontantPretRecommande(
        scenario.acquisition,
        scenario.apportPersonnel
      )
    ).toBe(234000);
  });

  test('resynchronizes financing when acquisition changes', () => {
    const currentScenario = creerScenarioVide('longue_duree');
    const nextScenario = {
      ...currentScenario,
      acquisition: {
        ...currentScenario.acquisition,
        prixAchat: 350000,
      },
    };

    const updatedScenario = harmoniserScenarioApresEdition(
      currentScenario,
      nextScenario
    );

    expect(updatedScenario.financement.montantPret).toBe(288000);
    expect(updatedScenario.financement.assuranceEmprunteurMensuelle).toBe(72);
    expect(updatedScenario.financement.fraisGarantie).toBe(1440);
  });

  test('resynchronizes financing when deposit changes', () => {
    const currentScenario = creerScenarioVide('longue_duree');
    const nextScenario = {
      ...currentScenario,
      apportPersonnel: 120000,
    };

    const updatedScenario = harmoniserScenarioApresEdition(
      currentScenario,
      nextScenario
    );

    expect(updatedScenario.financement.montantPret).toBe(214000);
    expect(updatedScenario.financement.assuranceEmprunteurMensuelle).toBe(54);
    expect(updatedScenario.financement.fraisGarantie).toBe(1070);
  });

  test('preserves explicit financing edits', () => {
    const currentScenario = creerScenarioVide('longue_duree');
    const nextScenario = {
      ...currentScenario,
      acquisition: {
        ...currentScenario.acquisition,
        prixAchat: 350000,
      },
      financement: {
        ...currentScenario.financement,
        montantPret: 260000,
        assuranceEmprunteurMensuelle: 40,
        fraisGarantie: 900,
      },
    };

    const updatedScenario = harmoniserScenarioApresEdition(
      currentScenario,
      nextScenario
    );

    expect(updatedScenario.financement.montantPret).toBe(260000);
    expect(updatedScenario.financement.assuranceEmprunteurMensuelle).toBe(40);
    expect(updatedScenario.financement.fraisGarantie).toBe(900);
  });
});
