'use client';

import { Scenario } from '@/domain/types';
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
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

interface HypothesesFormProps {
  scenario: Scenario;
  onUpdate: (scenario: Scenario) => void;
}

function parseNumber(str: string): number {
  return Number(str.replace(/\s/g, '')) || 0;
}

const TMI_OPTIONS = [
  { label: '0% (Non imposition)', value: 0 },
  { label: '11%', value: 0.11 },
  { label: '30%', value: 0.3 },
  { label: '41%', value: 0.41 },
  { label: '45%', value: 0.45 },
];

const REGIMES_FISCAUX = [
  { label: 'Micro-foncier', value: 'micro_foncier' },
  { label: 'Réel', value: 'reel' },
  { label: 'LMNP Micro-BIC', value: 'lmnp_micro' },
  { label: 'LMNP Réel', value: 'lmnp_reel' },
];

export default function HypothesesForm({ scenario, onUpdate }: HypothesesFormProps) {
  const hypotheses = scenario.hypotheses;
  const isLD = scenario.strategie === 'longue_duree';

  const handleHypothesesUpdate = (field: keyof typeof hypotheses, value: unknown) => {
    const updated = {
      ...scenario,
      hypotheses: {
        ...hypotheses,
        [field]: value,
      },
    };
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      {/* Vacance - Only for LD */}
      {isLD && (
        <>
          <div className="space-y-3">
            <Label htmlFor="vacance">Taux de vacance locative (LD)</Label>
            <div className="flex items-center gap-3 pt-2">
              <Slider
                id="vacance"
                min={0}
                max={100}
                step={0.5}
                value={[hypotheses.tauxVacanceLD * 100]}
                onValueChange={(val) =>
                  handleHypothesesUpdate('tauxVacanceLD', val[0] / 100)
                }
                className="flex-1"
              />
              <span className="text-sm font-medium min-w-12 text-right">
                {(hypotheses.tauxVacanceLD * 100).toFixed(1)} %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimation du taux de vacance annuel (logement sans locataire)
            </p>
          </div>

          <Separator />
        </>
      )}

      {/* Revalorisation loyers */}
      <div className="space-y-2">
        <Label htmlFor="reval-loyers">Revalorisation loyers annuelle (%)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="reval-loyers"
            type="number"
            step="0.1"
            value={Number((hypotheses.revalorisationLoyersAnnuelle * 100).toFixed(1))}
            onChange={(e) =>
              handleHypothesesUpdate('revalorisationLoyersAnnuelle', parseNumber(e.target.value) / 100)
            }
            placeholder="2"
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Augmentation annuelle attendue des loyers (inflation, marché)
        </p>
      </div>

      <Separator />

      {/* Revalorisation charges */}
      <div className="space-y-2">
        <Label htmlFor="reval-charges">Revalorisation charges annuelle (%)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="reval-charges"
            type="number"
            step="0.1"
            value={Number((hypotheses.revalorisationChargesAnnuelle * 100).toFixed(1))}
            onChange={(e) =>
              handleHypothesesUpdate('revalorisationChargesAnnuelle', parseNumber(e.target.value) / 100)
            }
            placeholder="2"
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Augmentation annuelle des charges (énergie, maintenance, etc.)
        </p>
      </div>

      <Separator />

      {/* Durée de détention */}
      <div className="space-y-2">
        <Label htmlFor="duree-detention">Durée de détention (années)</Label>
        <Input
          id="duree-detention"
          type="number"
          value={hypotheses.dureeDetention}
          onChange={(e) =>
            handleHypothesesUpdate('dureeDetention', parseInt(e.target.value) || 1)
          }
          placeholder="10"
          min="1"
        />
        <p className="text-xs text-muted-foreground">
          Durée pendant laquelle vous conserver le bien (pour les projections)
        </p>
      </div>

      <Separator />

      {/* Fiscalité */}
      <div className="space-y-4">
        <h4 className="font-medium">Fiscalité</h4>

        <div className="space-y-2">
          <Label htmlFor="tmi">Tranche marginale d'imposition (TMI)</Label>
          <Select
            value={String(hypotheses.tauxImposition)}
            onValueChange={(value) =>
              handleHypothesesUpdate('tauxImposition', parseFloat(value))
            }
          >
            <SelectTrigger id="tmi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TMI_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Votre taux d'imposition marginal sur le revenu (utilisé pour les impacts fiscaux)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="regime-fiscal">Régime fiscal</Label>
          <Select
            value={hypotheses.regimeFiscal}
            onValueChange={(value) =>
              handleHypothesesUpdate(
                'regimeFiscal',
                value as 'micro_foncier' | 'reel' | 'lmnp_micro' | 'lmnp_reel'
              )
            }
          >
            <SelectTrigger id="regime-fiscal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIMES_FISCAUX.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Régime d'imposition applicable à ce bien
          </p>
        </div>
      </div>

      <Separator />

      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h4 className="font-medium text-sm mb-3">Résumé des hypothèses</h4>
          <div className="space-y-2 text-sm">
            {isLD && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taux de vacance</span>
                <span className="font-medium">
                  {(hypotheses.tauxVacanceLD * 100).toFixed(1)} %
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Revalorisation loyers</span>
              <span className="font-medium">
                {(hypotheses.revalorisationLoyersAnnuelle * 100).toFixed(1)} % / an
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Revalorisation charges</span>
              <span className="font-medium">
                {(hypotheses.revalorisationChargesAnnuelle * 100).toFixed(1)} % / an
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée de détention</span>
              <span className="font-medium">{hypotheses.dureeDetention} ans</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">TMI</span>
              <span className="font-medium">
                {(hypotheses.tauxImposition * 100).toFixed(0)} %
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Régime fiscal</span>
              <span className="font-medium">
                {REGIMES_FISCAUX.find((r) => r.value === hypotheses.regimeFiscal)?.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
