'use client';

import { Scenario } from '@/domain/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface ChargesFormProps {
  scenario: Scenario;
  onUpdate: (scenario: Scenario) => void;
}

function parseNumber(str: string): number {
  return Number(str.replace(/\s/g, '')) || 0;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num));
}

export default function ChargesForm({ scenario, onUpdate }: ChargesFormProps) {
  const charges = scenario.charges;
  const isCD = scenario.strategie === 'courte_duree';

  const handleChargeUpdate = (field: keyof typeof charges, value: unknown) => {
    const updated = {
      ...scenario,
      charges: {
        ...charges,
        [field]: value,
      },
    };
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      {/* Taxes */}
      <div className="space-y-3">
        <h4 className="font-medium">Taxes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxe-fonciere">Taxe foncière (€/an)</Label>
            <Input
              id="taxe-fonciere"
              type="number"
              value={charges.taxeFonciere}
              onChange={(e) => handleChargeUpdate('taxeFonciere', parseNumber(e.target.value))}
              placeholder="2500"
              className="pr-8"
            />
          </div>

          {isCD && (
            <div className="space-y-2">
              <Label htmlFor="cfe">CFE - Cotisation foncière (€/an)</Label>
              <Input
                id="cfe"
                type="number"
                value={charges.cfe}
                onChange={(e) => handleChargeUpdate('cfe', parseNumber(e.target.value))}
                placeholder="500"
                className="pr-8"
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Assurances */}
      <div className="space-y-3">
        <h4 className="font-medium">Assurances</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assurance-pno">Assurance PNO (€/an)</Label>
            <Input
              id="assurance-pno"
              type="number"
              value={charges.assurancePNO}
              onChange={(e) => handleChargeUpdate('assurancePNO', parseNumber(e.target.value))}
              placeholder="600"
              className="pr-8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assurance-loyers">Assurance loyers impayés / GLI (€/an)</Label>
            <Input
              id="assurance-loyers"
              type="number"
              value={charges.assuranceLoyers}
              onChange={(e) => handleChargeUpdate('assuranceLoyers', parseNumber(e.target.value))}
              placeholder="450"
              className="pr-8"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Entretien */}
      <div className="space-y-3">
        <h4 className="font-medium">Entretien et maintenance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entretien-courant">Entretien courant (€/an)</Label>
            <Input
              id="entretien-courant"
              type="number"
              value={charges.entretienCourant}
              onChange={(e) => handleChargeUpdate('entretienCourant', parseNumber(e.target.value))}
              placeholder="1500"
              className="pr-8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gros-entretien">Provision gros entretien (€/an)</Label>
            <Input
              id="gros-entretien"
              type="number"
              value={charges.grosEntretien}
              onChange={(e) => handleChargeUpdate('grosEntretien', parseNumber(e.target.value))}
              placeholder="2000"
              className="pr-8"
            />
            <p className="text-xs text-muted-foreground">
              Provision annuelle pour travaux futurs (toiture, isolation, etc.)
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Gestion */}
      <div className="space-y-3">
        <h4 className="font-medium">Gestion</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gestion-locative">Gestion locative (% des loyers)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="gestion-locative"
                type="number"
                step="0.1"
                value={Number((charges.gestionLocative * 100).toFixed(1))}
                onChange={(e) =>
                  handleChargeUpdate('gestionLocative', parseNumber(e.target.value) / 100)
                }
                placeholder="8"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pourcentage des revenus bruts consacré à la gestion
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comptabilite">Comptabilité (€/an)</Label>
            <Input
              id="comptabilite"
              type="number"
              value={charges.comptabilite}
              onChange={(e) => handleChargeUpdate('comptabilite', parseNumber(e.target.value))}
              placeholder="500"
              className="pr-8"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Copropriété */}
      <div className="space-y-2">
        <Label htmlFor="copropriete">Charges de copropriété (€/an)</Label>
        <Input
          id="copropriete"
          type="number"
          value={charges.copropriete}
          onChange={(e) => handleChargeUpdate('copropriete', parseNumber(e.target.value))}
          placeholder="1500"
          className="pr-8"
        />
        <p className="text-xs text-muted-foreground">
          Charges non récupérables (parties communes, ascenseur, etc.)
        </p>
      </div>

      <Separator />

      {/* Autres frais */}
      <div className="space-y-2">
        <Label htmlFor="autres-charges">Autres frais (€/an)</Label>
        <Input
          id="autres-charges"
          type="number"
          value={charges.autresCharges}
          onChange={(e) => handleChargeUpdate('autresCharges', parseNumber(e.target.value))}
          placeholder="0"
          className="pr-8"
        />
        <Textarea
          value={charges.descriptionAutres}
          onChange={(e) => handleChargeUpdate('descriptionAutres', e.target.value)}
          placeholder="Détail des autres frais (ramonage, assainissement, etc.)"
          className="mt-2 min-h-20"
        />
      </div>

      <Separator />

      {/* Summary */}
      <div className="p-4 bg-muted rounded-lg space-y-2">
        <h4 className="font-medium mb-3">Résumé charges annuelles</h4>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Taxe foncière</span>
            <span className="font-medium">{formatNumber(charges.taxeFonciere)} €</span>
          </div>

          {isCD && (
            <div className="flex justify-between">
              <span>CFE</span>
              <span className="font-medium">{formatNumber(charges.cfe)} €</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Assurances (PNO + Loyers)</span>
            <span className="font-medium">
              {formatNumber(charges.assurancePNO + charges.assuranceLoyers)} €
            </span>
          </div>

          <div className="flex justify-between">
            <span>Entretien (courant + provision)</span>
            <span className="font-medium">
              {formatNumber(charges.entretienCourant + charges.grosEntretien)} €
            </span>
          </div>

          <div className="flex justify-between">
            <span>Gestion locative*</span>
            <span className="font-medium text-muted-foreground">
              ({Number((charges.gestionLocative * 100).toFixed(1))}% des loyers)
            </span>
          </div>

          <div className="flex justify-between">
            <span>Comptabilité</span>
            <span className="font-medium">{formatNumber(charges.comptabilite)} €</span>
          </div>

          <div className="flex justify-between">
            <span>Copropriété</span>
            <span className="font-medium">{formatNumber(charges.copropriete)} €</span>
          </div>

          {charges.autresCharges > 0 && (
            <div className="flex justify-between">
              <span>Autres</span>
              <span className="font-medium">{formatNumber(charges.autresCharges)} €</span>
            </div>
          )}
        </div>

        <div className="border-t border-border mt-3 pt-3 text-xs text-muted-foreground">
          <p>
            * La gestion locative est calculée en pourcentage des revenus bruts et apparaît dans
            les résultats.
          </p>
        </div>
      </div>
    </div>
  );
}
