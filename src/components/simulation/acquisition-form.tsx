'use client';

import { Scenario } from '@/domain/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface AcquisitionFormProps {
  scenario: Scenario;
  onUpdate: (scenario: Scenario) => void;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num));
}

function parseNumber(str: string): number {
  return Number(str.replace(/\s/g, '')) || 0;
}

export default function AcquisitionForm({ scenario, onUpdate }: AcquisitionFormProps) {

  const acquisition = scenario.acquisition;
  const calculateNotaire = () => {
    if (acquisition.fraisNotaire > 0) return acquisition.fraisNotaire;
    return acquisition.prixAchat * acquisition.fraisNotairePct;
  };

  const notaireAmount = calculateNotaire();

  const handleFieldChange = (field: keyof typeof acquisition, value: any) => {
    const updated = {
      ...scenario,
      acquisition: {
        ...acquisition,
        [field]: value,
      },
    };
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      {/* Prix d'achat */}
      <div className="space-y-2">
        <Label htmlFor="prix-achat">Prix d'achat</Label>
        <div className="relative">
          <Input
            id="prix-achat"
            type="number"
            value={acquisition.prixAchat}
            onChange={(e) => handleFieldChange('prixAchat', parseNumber(e.target.value))}
            placeholder="300000"
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            €
          </span>
        </div>
      </div>

      <Separator />

      {/* Frais de notaire */}
      <div className="space-y-3">
        <Label>Frais de notaire</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={acquisition.fraisNotaire > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleFieldChange('fraisNotaire', acquisition.prixAchat * acquisition.fraisNotairePct);
                } else {
                  handleFieldChange('fraisNotaire', 0);
                }
              }}
            />
            <span className="text-sm">Montant fixe</span>
          </div>

          {acquisition.fraisNotaire > 0 ? (
            <Input
              type="number"
              value={acquisition.fraisNotaire}
              onChange={(e) => handleFieldChange('fraisNotaire', parseNumber(e.target.value))}
              placeholder="24000"
              className="pr-8"
            />
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={Number((acquisition.fraisNotairePct * 100).toFixed(2))}
                onChange={(e) => handleFieldChange('fraisNotairePct', parseNumber(e.target.value) / 100)}
                placeholder="8"
                className="pr-8"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-sm font-medium">
                = {formatNumber(notaireAmount)} €
              </span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Frais d'agence */}
      <div className="space-y-3">
        <Label>Frais d'agence</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={!acquisition.fraisAgenceInclus}
              onCheckedChange={(checked) => {
                handleFieldChange('fraisAgenceInclus', !checked);
              }}
            />
            <span className="text-sm">Hors FAI</span>
          </div>

          {!acquisition.fraisAgenceInclus && (
            <Input
              type="number"
              value={acquisition.fraisAgence}
              onChange={(e) => handleFieldChange('fraisAgence', parseNumber(e.target.value))}
              placeholder="10000"
              className="pr-8"
            />
          )}
          {acquisition.fraisAgenceInclus && (
            <p className="text-xs text-muted-foreground">Inclus dans le prix d'achat (FAI)</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Travaux */}
      <div className="space-y-2">
        <Label htmlFor="travaux">Montant des travaux</Label>
        <Input
          id="travaux"
          type="number"
          value={acquisition.montantTravaux}
          onChange={(e) => handleFieldChange('montantTravaux', parseNumber(e.target.value))}
          placeholder="15000"
          className="pr-8"
        />
        <Textarea
          value={acquisition.detailTravaux}
          onChange={(e) => handleFieldChange('detailTravaux', e.target.value)}
          placeholder="Détail des travaux (toiture, électricité, plomberie...)"
          className="mt-2 min-h-24"
        />
      </div>

      <Separator />

      {/* Ameublement - Only for courte durée */}
      {scenario.strategie === 'courte_duree' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ameublement">Montant ameublement</Label>
            <Input
              id="ameublement"
              type="number"
              value={acquisition.montantAmeublement}
              onChange={(e) => handleFieldChange('montantAmeublement', parseNumber(e.target.value))}
              placeholder="8000"
              className="pr-8"
            />
            <p className="text-xs text-muted-foreground">
              Lits, meubles, équipements pour la courte durée
            </p>
          </div>

          <Separator />
        </>
      )}

      {/* Autres frais */}
      <div className="space-y-2">
        <Label htmlFor="autres-frais">Autres frais</Label>
        <Input
          id="autres-frais"
          type="number"
          value={acquisition.autresFrais}
          onChange={(e) => handleFieldChange('autresFrais', parseNumber(e.target.value))}
          placeholder="5000"
          className="pr-8"
        />
        <Textarea
          value={acquisition.descriptionAutresFrais}
          onChange={(e) => handleFieldChange('descriptionAutresFrais', e.target.value)}
          placeholder="Autres frais (diagnostics, frais bancaires, etc.)"
          className="mt-2 min-h-20"
        />
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Prix d'achat</span>
          <span className="font-medium">{formatNumber(acquisition.prixAchat)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>+ Frais de notaire</span>
          <span className="font-medium">{formatNumber(notaireAmount)} €</span>
        </div>
        {!acquisition.fraisAgenceInclus && (
          <div className="flex justify-between text-sm">
            <span>+ Frais d'agence</span>
            <span className="font-medium">{formatNumber(acquisition.fraisAgence)} €</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>+ Travaux</span>
          <span className="font-medium">{formatNumber(acquisition.montantTravaux)} €</span>
        </div>
        {scenario.strategie === 'courte_duree' && (
          <div className="flex justify-between text-sm">
            <span>+ Ameublement</span>
            <span className="font-medium">{formatNumber(acquisition.montantAmeublement)} €</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>+ Autres frais</span>
          <span className="font-medium">{formatNumber(acquisition.autresFrais)} €</span>
        </div>
        <div className="border-t border-border my-2 pt-2 flex justify-between font-bold">
          <span>Total acquisition</span>
          <span className="text-primary">
            {formatNumber(
              acquisition.prixAchat +
              notaireAmount +
              (acquisition.fraisAgenceInclus ? 0 : acquisition.fraisAgence) +
              acquisition.montantTravaux +
              acquisition.montantAmeublement +
              acquisition.autresFrais
            )} €
          </span>
        </div>
      </div>
    </div>
  );
}
