'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

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

import { formatCurrency, formatPercent } from '@/lib/format';

interface ResultatsSidebarProps {
  scenario: Scenario;
}

export function ResultatsSidebar({ scenario }: ResultatsSidebarProps) {
  const resultats = calculerResultatsScenario(scenario);
  const alertes = validerScenario(scenario);
  const erreurs = alertes.filter((a) => a.type === 'erreur');

  const strategyLabel =
    scenario.strategie === 'longue_duree' ? 'LD' : 'CD';
  const isCashFlowPositive = resultats.cashFlowMensuelAvantImpot >= 0;

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{scenario.nom}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {strategyLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cash-flow - Large display */}
        <div className="space-y-1">
          <CardDescription className="text-xs">
            Cash-flow mensuel
          </CardDescription>
          <div
            className={`text-2xl font-bold ${
              isCashFlowPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(resultats.cashFlowMensuelAvantImpot)}
          </div>
        </div>

        {/* Rendements - Compact display */}
        <div className="space-y-2 pt-2 border-t">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-muted-foreground text-xs">Brut</p>
              <p className="font-semibold text-sm">
                {formatPercent(resultats.rendementBrut, 1)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Net</p>
              <p className="font-semibold text-sm">
                {formatPercent(resultats.rendementNet, 1)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Net-net</p>
              <p className="font-semibold text-sm">
                {formatPercent(resultats.rendementNetNet, 1)}
              </p>
            </div>
          </div>
        </div>

        {/* Financing */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Mensualité crédit</span>
            <span className="font-semibold">
              {formatCurrency(resultats.chargeFinancementMensuelle)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Apport requis</span>
            <span className="font-semibold">
              {formatCurrency(resultats.apportTotal)}
            </span>
          </div>
        </div>

        {/* Alerts badge */}
        {erreurs.length > 0 && (
          <div className="pt-2 border-t">
            <Badge variant="destructive" className="w-full justify-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              {erreurs.length} erreur{erreurs.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {alertes.length > erreurs.length && (
          <div className="pt-2">
            <Badge
              variant="outline"
              className="w-full justify-center text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              {alertes.length - erreurs.length} alerte{alertes.length - erreurs.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
