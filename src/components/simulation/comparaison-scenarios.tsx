'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Scenario } from '@/domain/types';
import { calculerResultatsScenario, comparerScenarios } from '@/domain/calculs';
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
import { Separator } from '@/components/ui/separator';

import { formatCurrency, formatPercent, formatNumber } from '@/lib/format';

interface ComparaisonScenariosProps {
  scenarios: Scenario[];
}

export function ComparaisonScenarios({ scenarios }: ComparaisonScenariosProps) {
  if (scenarios.length < 2) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <p className="text-center text-amber-700 dark:text-amber-400">
            Ajoutez au moins 2 scénarios pour comparer
          </p>
        </CardContent>
      </Card>
    );
  }

  const comparaison = comparerScenarios(scenarios);
  const resultats = comparaison.scenarios;

  // Prepare data for charts
  const chartData = resultats.map((r) => ({
    nom: r.scenarioNom,
    scenarioId: r.scenarioId,
    'Cash-flow': r.cashFlowAnnuelAvantImpot / 12, // Monthly
    'Rendement brut': r.rendementBrut,
    'Rendement net': r.rendementNet,
    'Rendement net-net': r.rendementNetNet,
  }));

  const metriques = [
    {
      label: 'Stratégie',
      key: 'strategie' as const,
      format: (value: unknown) =>
        (value as string) === 'longue_duree' ? 'Longue durée' : 'Courte durée',
    },
    {
      label: 'Nb lots',
      key: 'resultatsParLot' as const,
      format: (value: unknown) => (value as unknown[]).length,
    },
    {
      label: 'Investissement total',
      key: 'investissementTotal' as const,
      format: (value: unknown) => formatCurrency(value as number),
      isMoney: true,
    },
    {
      label: 'Revenus bruts annuels',
      key: 'revenuBrutAnnuel' as const,
      format: (value: unknown) => formatCurrency(value as number),
      isMoney: true,
    },
    {
      label: 'Charges exploitation',
      key: 'chargesExploitationAnnuelles' as const,
      format: (value: unknown) => formatCurrency(value as number),
      isMoney: true,
    },
    {
      label: 'Cash-flow mensuel',
      key: 'cashFlowMensuelAvantImpot' as const,
      format: (value: unknown) => formatCurrency(value as number),
      isMoney: true,
      highlight: true,
    },
    {
      label: 'Rendement brut',
      key: 'rendementBrut' as const,
      format: (value: unknown) => formatPercent(value as number, 2),
      isPercent: true,
    },
    {
      label: 'Rendement net',
      key: 'rendementNet' as const,
      format: (value: unknown) => formatPercent(value as number, 2),
      isPercent: true,
    },
    {
      label: 'Rendement net-net',
      key: 'rendementNetNet' as const,
      format: (value: unknown) => formatPercent(value as number, 2),
      isPercent: true,
    },
  ];

  // Function to get value from results
  const getMetricValue = (result: any, key: string): any => {
    if (key === 'strategie') return result.strategie;
    if (key === 'resultatsParLot') return result.resultatsParLot;
    return result[key];
  };

  // Function to find best value for a metric
  const findBestIndex = (metriqueKey: string): number => {
    let bestIndex = 0;
    let bestValue = -Infinity;

    resultats.forEach((r, index) => {
      const value = getMetricValue(r, metriqueKey);
      let numValue = value;

      if (typeof value === 'string') {
        numValue = value === 'longue_duree' ? 1 : 0;
      } else if (Array.isArray(value)) {
        numValue = value.length;
      }

      if (numValue > bestValue) {
        bestValue = numValue;
        bestIndex = index;
      }
    });

    return bestIndex;
  };

  return (
    <div className="space-y-6">
      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des scénarios</CardTitle>
          <CardDescription>
            Le meilleur value pour chaque métrique est mis en évidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Métrique</TableHead>
                  {resultats.map((r) => (
                    <TableHead key={r.scenarioId} className="text-right">
                      <div className="font-semibold text-foreground">
                        {r.scenarioNom}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {r.strategie === 'longue_duree'
                          ? 'LD'
                          : 'CD'}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metriques.map((metrique) => {
                  const bestIndex = findBestIndex(metrique.key);

                  return (
                    <TableRow
                      key={metrique.key}
                      className={metrique.highlight ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {metrique.label}
                      </TableCell>
                      {resultats.map((r, index) => {
                        const value = getMetricValue(r, metrique.key);
                        const formatted = metrique.format(value);
                        const isBest = index === bestIndex;

                        return (
                          <TableCell
                            key={r.scenarioId}
                            className={`text-right ${
                              isBest
                                ? 'bg-green-100 dark:bg-green-950/40 font-semibold'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-end gap-2">
                              {isBest && (
                                <Badge variant="secondary" className="text-xs">
                                  Meilleur
                                </Badge>
                              )}
                              <span>{formatted}</span>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cash-flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cash-flow mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Bar dataKey="Cash-flow" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rendements Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparaison des rendements</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => formatPercent(value as number, 2)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Legend />
              <Bar dataKey="Rendement brut" fill="#3b82f6" />
              <Bar dataKey="Rendement net" fill="#10b981" />
              <Bar dataKey="Rendement net-net" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Synthèse comparative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Meilleur cash-flow mensuel
              </p>
              <p className="text-lg font-semibold">
                {
                  resultats.find((r) => r.scenarioId === comparaison.meilleurCashFlow)
                    ?.scenarioNom
                }
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  resultats.find((r) => r.scenarioId === comparaison.meilleurCashFlow)
                    ?.cashFlowMensuelAvantImpot || 0
                )}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Meilleur rendement brut
              </p>
              <p className="text-lg font-semibold">
                {
                  resultats.find((r) => r.scenarioId === comparaison.meilleurRendementBrut)
                    ?.scenarioNom
                }
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatPercent(
                  resultats.find((r) => r.scenarioId === comparaison.meilleurRendementBrut)
                    ?.rendementBrut || 0,
                  2
                )}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Meilleur rendement net
              </p>
              <p className="text-lg font-semibold">
                {
                  resultats.find((r) => r.scenarioId === comparaison.meilleurRendementNet)
                    ?.scenarioNom
                }
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatPercent(
                  resultats.find((r) => r.scenarioId === comparaison.meilleurRendementNet)
                    ?.rendementNet || 0,
                  2
                )}
              </p>
            </div>
          </div>

          <Separator />

          <div className="text-sm space-y-2">
            <p className="font-semibold">Recommandations</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              {scenarios.length === 2 ? (
                <>
                  <li>
                    {
                      resultats.find((r) => r.scenarioId === comparaison.meilleurCashFlow)
                        ?.scenarioNom
                    }{' '}
                    offre un meilleur cash-flow mensuel
                  </li>
                  <li>
                    {
                      resultats.find((r) => r.scenarioId === comparaison.meilleurRendementBrut)
                        ?.scenarioNom
                    }{' '}
                    offre un meilleur rendement brut
                  </li>
                  <li>
                    Vérifiez les hypothèses de vacance et d'occupation avant
                    de décider
                  </li>
                </>
              ) : (
                <>
                  <li>
                    {scenarios.length} scénarios comparés avec succès
                  </li>
                  <li>
                    Consultez le tableau de comparaison pour les détails de
                    chaque métrique
                  </li>
                  <li>
                    Les meilleurs performers sont mis en évidence en vert
                  </li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
