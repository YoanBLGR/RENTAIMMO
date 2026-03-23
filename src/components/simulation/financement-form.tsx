'use client';

import { Scenario } from '@/domain/types';
import { calculerMensualitePret } from '@/domain/calculs';
import { calculerMontantPretRecommande } from '@/domain/scenario-updates';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

interface FinancementFormProps {
  scenario: Scenario;
  onUpdate: (scenario: Scenario) => void;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num));
}

function parseNumber(str: string): number {
  return Number(str.replace(/\s/g, '')) || 0;
}

const DUREES = [
  { label: '15 ans', months: 180 },
  { label: '20 ans', months: 240 },
  { label: '25 ans', months: 300 },
  { label: '30 ans', months: 360 },
];

export default function FinancementForm({ scenario, onUpdate }: FinancementFormProps) {
  const financement = scenario.financement;
  const acquisition = scenario.acquisition;

  const montantPretRecommande = calculerMontantPretRecommande(
    acquisition,
    scenario.apportPersonnel
  );

  const handleFinancementUpdate = (field: keyof typeof financement, value: unknown) => {
    const updated = {
      ...scenario,
      financement: {
        ...financement,
        [field]: value,
      },
    };
    onUpdate(updated);
  };

  const handleApportUpdate = (value: number) => {
    const updated = {
      ...scenario,
      apportPersonnel: value,
    };
    onUpdate(updated);
  };

  // Calculate monthly payment
  const mensualiteHorsAssurance = calculerMensualitePret(
    financement.montantPret,
    financement.tauxInteret,
    financement.dureeMois
  );
  const mensualiteAvecAssurance =
    mensualiteHorsAssurance + financement.assuranceEmprunteurMensuelle;

  return (
    <div className="space-y-6">
      {/* Apport personnel */}
      <div className="space-y-2">
        <Label htmlFor="apport">Apport personnel (€)</Label>
        <Input
          id="apport"
          type="number"
          value={scenario.apportPersonnel}
          onChange={(e) => handleApportUpdate(parseNumber(e.target.value))}
          placeholder="100000"
          className="pr-8"
        />
        <p className="text-xs text-muted-foreground">
          Montant à financer: {formatNumber(montantPretRecommande)} €
        </p>
      </div>

      <Separator />

      {/* Crédit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pret">Montant du prêt (€)</Label>
          <Input
            id="pret"
            type="number"
            value={financement.montantPret}
            onChange={(e) => handleFinancementUpdate('montantPret', parseNumber(e.target.value))}
            placeholder="250000"
            className="pr-8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taux">Taux d&apos;intérêt annuel (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="taux"
              type="number"
              step="0.01"
              value={Number((financement.tauxInteret * 100).toFixed(2))}
              onChange={(e) =>
                handleFinancementUpdate('tauxInteret', parseNumber(e.target.value) / 100)
              }
              placeholder="3.5"
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duree">Durée du crédit</Label>
          <Select
            value={String(financement.dureeMois)}
            onValueChange={(value) =>
              handleFinancementUpdate('dureeMois', parseInt(value))
            }
          >
            <SelectTrigger id="duree">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DUREES.map((d) => (
                <SelectItem key={d.months} value={String(d.months)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="differe">Différé (mois)</Label>
          <Input
            id="differe"
            type="number"
            value={financement.differeMois}
            onChange={(e) =>
              handleFinancementUpdate('differeMois', parseInt(e.target.value) || 0)
            }
            placeholder="0"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Période sans remboursement du capital (intérêts seuls)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amortissement">Type d&apos;amortissement</Label>
        <Select
          value={financement.typeAmortissement}
          onValueChange={(value) =>
            handleFinancementUpdate('typeAmortissement', value as 'constant' | 'lineaire')
          }
        >
          <SelectTrigger id="amortissement">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="constant">Annuités constantes</SelectItem>
            <SelectItem value="lineaire">Amortissement linéaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Assurance et frais */}
      <div className="space-y-3">
        <h4 className="font-medium">Assurance et frais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assurance">Assurance emprunteur (€/mois)</Label>
            <Input
              id="assurance"
              type="number"
              value={financement.assuranceEmprunteurMensuelle}
              onChange={(e) =>
                handleFinancementUpdate('assuranceEmprunteurMensuelle', parseNumber(e.target.value))
              }
              placeholder="0"
              className="pr-8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frais-dossier">Frais de dossier (€)</Label>
            <Input
              id="frais-dossier"
              type="number"
              value={financement.fraisDossier}
              onChange={(e) =>
                handleFinancementUpdate('fraisDossier', parseNumber(e.target.value))
              }
              placeholder="1500"
              className="pr-8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frais-garantie">Frais de garantie/hypothèque (€)</Label>
            <Input
              id="frais-garantie"
              type="number"
              value={financement.fraisGarantie}
              onChange={(e) =>
                handleFinancementUpdate('fraisGarantie', parseNumber(e.target.value))
              }
              placeholder="1250"
              className="pr-8"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Résumé calculé */}
      <Card className="bg-muted">
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Mensualité (hors assurance)</p>
              <p className="font-bold text-lg">{formatNumber(mensualiteHorsAssurance)} €</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mensualité (avec assurance)</p>
              <p className="font-bold text-lg text-primary">
                {formatNumber(mensualiteAvecAssurance)} €
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Coût total intérêts</p>
              <p className="font-medium">
                {formatNumber(
                  mensualiteHorsAssurance * financement.dureeMois - financement.montantPret
                )}{' '}
                €
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Coût total crédit (intérêts + frais)</p>
              <p className="font-medium">
                {formatNumber(
                  financement.montantPret +
                  (mensualiteHorsAssurance * financement.dureeMois - financement.montantPret) +
                  financement.fraisDossier +
                  financement.fraisGarantie
                )}{' '}
                €
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Coût assurance totale</p>
            <p className="font-medium">
              {formatNumber(financement.assuranceEmprunteurMensuelle * financement.dureeMois)} €
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
