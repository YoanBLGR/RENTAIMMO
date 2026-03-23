'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  CheckCircle,
  Euro,
  Home,
  Percent,
  PiggyBank,
} from 'lucide-react';

import { Scenario } from '@/domain/types';
import { calculerResultatsScenario } from '@/domain/calculs';
import { validerScenario } from '@/domain/validations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatSquareMeters,
} from '@/lib/format';

interface ResultatsScenariosProps {
  scenario: Scenario;
}

export function ResultatsScenario({ scenario }: ResultatsScenariosProps) {
  const resultats = calculerResultatsScenario(scenario);
  const alertes = validerScenario(scenario);

  // Determine KPI colors
  const isCashFlowPositive = resultats.cashFlowMensuelAvantImpot >= 0;

  return (
    <div className="space-y-6">
      {/* Section 1: Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash-flow mensuel */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Cash-flow mensuel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                isCashFlowPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(resultats.cashFlowMensuelAvantImpot)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">avant impôt</p>
          </CardContent>
        </Card>

        {/* Rendement brut */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Rendement brut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatPercent(resultats.rendementBrut, 2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(resultats.revenuBrutAnnuel)} / an
            </p>
          </CardContent>
        </Card>

        {/* Rendement net */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Rendement net
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatPercent(resultats.rendementNet, 2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              après charges d'exploitation
            </p>
          </CardContent>
        </Card>

        {/* Rendement net-net */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4" />
              Rendement net-net
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatPercent(resultats.rendementNetNet, 2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              sur apport personnel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Synthèse financière */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Synthèse financière</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Libellé</TableHead>
                <TableHead className="text-right">Mensuel</TableHead>
                <TableHead className="text-right">Annuel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Revenus bruts</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(resultats.revenuBrutMensuel)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(resultats.revenuBrutAnnuel)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Charges d'exploitation
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(resultats.chargesExploitationMensuelles)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(resultats.chargesExploitationAnnuelles)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">
                  Résultat net d'exploitation
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(
                    resultats.revenuBrutMensuel -
                      resultats.chargesExploitationMensuelles
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(
                    resultats.revenuBrutAnnuel -
                      resultats.chargesExploitationAnnuelles
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Charge de financement
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(resultats.chargeFinancementMensuelle)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(resultats.chargeFinancementAnnuelle)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-blue-50 dark:bg-blue-950/20">
                <TableCell className="font-bold">
                  Cash-flow avant impôt
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(resultats.cashFlowMensuelAvantImpot)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(resultats.cashFlowAnnuelAvantImpot)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 3: Détail des revenus par lot */}
      {scenario.lots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Détail des revenus par lot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead className="text-right">Surface</TableHead>
                  <TableHead className="text-right">
                    {scenario.strategie === 'longue_duree'
                      ? 'Loyer/mois'
                      : 'Tarif/nuit'}
                  </TableHead>
                  <TableHead className="text-right">Revenu brut annuel</TableHead>
                  <TableHead className="text-right">Charges lot</TableHead>
                  <TableHead className="text-right">Revenu net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenario.lots.map((lot) => {
                  const lotResultats = resultats.resultatsParLot.find(
                    (r) => r.lotId === lot.id
                  );
                  if (!lotResultats) return null;

                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.nom}</TableCell>
                      <TableCell className="text-right">
                        {formatSquareMeters(lot.surface)}
                      </TableCell>
                      <TableCell className="text-right">
                        {scenario.strategie === 'longue_duree'
                          ? formatCurrency(lot.loyerMensuelLD)
                          : formatCurrency(lot.tarifNuiteeCD)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(lotResultats.revenuBrutAnnuel)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          lotResultats.chargesExploitationLotAnnuel
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(lotResultats.revenuNetLotAnnuel)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Détail des charges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail des charges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {Object.entries(resultats.detailCharges).map(([key, value]) => {
              const totalCharges = resultats.chargesExploitationAnnuelles;
              const percentage =
                totalCharges > 0 ? (value / totalCharges) * 100 : 0;

              if (value === 0) return null;

              const labels: Record<string, string> = {
                taxeFonciere: 'Taxe foncière',
                assurances: 'Assurances',
                entretien: 'Entretien',
                gestionLocative: 'Gestion locative',
                comptabilite: 'Comptabilité',
                copropriete: 'Copropriété',
                cfe: 'CFE',
                chargesLotsCourtesDuree: 'Charges lots CD',
                autresCharges: 'Autres charges',
              };

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{labels[key]}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
          <Separator />
          <div className="flex justify-between items-center font-bold">
            <span>Total charges annuelles</span>
            <span>{formatCurrency(resultats.chargesExploitationAnnuelles)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Investissement & Financement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investissement total</CardTitle>
            <CardDescription>Détail des frais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Prix d'achat</span>
              <span>{formatCurrency(scenario.acquisition.prixAchat)}</span>
            </div>

            {scenario.acquisition.fraisNotaire > 0 ||
            scenario.acquisition.fraisNotairePct > 0 ? (
              <div className="flex justify-between text-sm">
                <span>Frais de notaire</span>
                <span>
                  {formatCurrency(
                    scenario.acquisition.fraisNotaire > 0
                      ? scenario.acquisition.fraisNotaire
                      : scenario.acquisition.prixAchat *
                          scenario.acquisition.fraisNotairePct
                  )}
                </span>
              </div>
            ) : null}

            {!scenario.acquisition.fraisAgenceInclus &&
            scenario.acquisition.fraisAgence > 0 ? (
              <div className="flex justify-between text-sm">
                <span>Frais d'agence</span>
                <span>{formatCurrency(scenario.acquisition.fraisAgence)}</span>
              </div>
            ) : null}

            {scenario.acquisition.montantTravaux > 0 && (
              <div className="flex justify-between text-sm">
                <span>Travaux</span>
                <span>{formatCurrency(scenario.acquisition.montantTravaux)}</span>
              </div>
            )}

            {scenario.acquisition.montantAmeublement > 0 && (
              <div className="flex justify-between text-sm">
                <span>Ameublement</span>
                <span>
                  {formatCurrency(scenario.acquisition.montantAmeublement)}
                </span>
              </div>
            )}

            {scenario.acquisition.autresFrais > 0 && (
              <div className="flex justify-between text-sm">
                <span>Autres frais</span>
                <span>{formatCurrency(scenario.acquisition.autresFrais)}</span>
              </div>
            )}

            {scenario.financement.fraisDossier > 0 && (
              <div className="flex justify-between text-sm">
                <span>Frais de dossier crédit</span>
                <span>
                  {formatCurrency(scenario.financement.fraisDossier)}
                </span>
              </div>
            )}

            {scenario.financement.fraisGarantie > 0 && (
              <div className="flex justify-between text-sm">
                <span>Frais de garantie</span>
                <span>
                  {formatCurrency(scenario.financement.fraisGarantie)}
                </span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-bold">
              <span>Investissement total</span>
              <span>{formatCurrency(resultats.investissementTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financement</CardTitle>
            <CardDescription>
              Crédit de {formatCurrency(scenario.financement.montantPret)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Mensualité (hors assurance)</span>
              <span>
                {formatCurrency(
                  resultats.financement.mensualiteHorsAssurance
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Mensualité (avec assurance)</span>
              <span>
                {formatCurrency(
                  resultats.financement.mensualiteAvecAssurance
                )}
              </span>
            </div>

            {scenario.financement.assuranceEmprunteurMensuelle > 0 && (
              <div className="flex justify-between text-sm">
                <span>Assurance emprunteur mensuelle</span>
                <span>
                  {formatCurrency(
                    scenario.financement.assuranceEmprunteurMensuelle
                  )}
                </span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-sm">
              <span>Coût total intérêts</span>
              <span>
                {formatCurrency(resultats.financement.coutTotalInterets)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Coût total assurance</span>
              <span>
                {formatCurrency(resultats.financement.coutTotalAssurance)}
              </span>
            </div>

            <div className="flex justify-between font-bold">
              <span>Coût total du crédit</span>
              <span>
                {formatCurrency(resultats.financement.coutTotalCredit)}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-base">
              <span>Apport requis</span>
              <span>{formatCurrency(resultats.apportTotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              dont frais non financés:{' '}
              {formatCurrency(
                resultats.apportTotal - scenario.apportPersonnel
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 6: Alertes */}
      {alertes.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Alertes et points de vigilance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertes.map((alerte, index) => {
              const isError = alerte.type === 'erreur';
              const isWarning = alerte.type === 'attention';

              return (
                <Alert
                  key={index}
                  variant={isError ? 'destructive' : 'default'}
                  className={
                    isWarning
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
                      : isError
                      ? ''
                      : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20'
                  }
                >
                  <div className="flex gap-3">
                    {isError && (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    {isWarning && (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    {alerte.type === 'info' && (
                      <Info className="w-4 h-4 text-blue-600" />
                    )}
                    <div className="flex-1">
                      <AlertTitle className="text-sm font-semibold">
                        {alerte.message}
                      </AlertTitle>
                      {alerte.details && (
                        <AlertDescription className="text-xs mt-1">
                          {alerte.details}
                        </AlertDescription>
                      )}
                    </div>
                  </div>
                </Alert>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
