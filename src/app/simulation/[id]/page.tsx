'use client';

import { use, useState } from 'react';
import { useSimulationStore } from '@/store/simulation-store';
import { Scenario } from '@/domain/types';
import { creerScenarioVide } from '@/domain/defaults';
import { calculerResultatsScenario } from '@/domain/calculs';
import { harmoniserScenarioApresEdition } from '@/domain/scenario-updates';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import AcquisitionForm from '@/components/simulation/acquisition-form';
import LotsForm from '@/components/simulation/lots-form';
import FinancementForm from '@/components/simulation/financement-form';
import ChargesForm from '@/components/simulation/charges-form';
import HypothesesForm from '@/components/simulation/hypotheses-form';
import { Plus, Copy, Trash2 } from 'lucide-react';
import ExportButton from '@/components/simulation/export-button';

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num));
}

export default function SimulationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { state, setActive, updateSimulation, updateScenario, deleteScenario, addScenario } =
    useSimulationStore();
  const simulation = state.simulations.find((s) => s.id === id);

  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [activeSection, setActiveSection] = useState('acquisition');
  const [newScenarioDialog, setNewScenarioDialog] = useState(false);
  const [newScenarioStrategy, setNewScenarioStrategy] = useState<'longue_duree' | 'courte_duree'>('longue_duree');
  const [deleteConfirm, setDeleteConfirm] = useState<{ scenarioId?: string; deleteName?: string } | null>(null);

  // Set active on mount
  if (id && state.activeSimulationId !== id) {
    setActive(id);
  }

  const activeScenario = simulation?.scenarios[activeScenarioIdx];
  const resultats = activeScenario ? calculerResultatsScenario(activeScenario) : null;

  const handleSimulationNameChange = (newName: string) => {
    if (!simulation) return;
    updateSimulation({ ...simulation, nom: newName, dateMiseAJour: new Date().toISOString() });
  };

  const handleScenarioUpdate = (updatedScenario: Scenario) => {
    if (!simulation) return;
    const currentScenario = simulation.scenarios.find(
      (scenario) => scenario.id === updatedScenario.id
    );
    if (!currentScenario) return;

    updateScenario(
      simulation.id,
      harmoniserScenarioApresEdition(currentScenario, updatedScenario)
    );
  };

  const handleAddScenario = () => {
    if (!simulation) return;
    const newScenario = creerScenarioVide(newScenarioStrategy);
    addScenario(simulation.id, newScenario);
    setNewScenarioDialog(false);
    setActiveScenarioIdx(simulation.scenarios.length);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    if (!simulation) return;
    deleteScenario(simulation.id, scenarioId);
    setActiveScenarioIdx(Math.max(0, activeScenarioIdx - 1));
    setDeleteConfirm(null);
  };

  if (!simulation) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Simulation non trouvée
      </div>
    );
  }

  if (!activeScenario) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucun scénario disponible
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <Input
                value={simulation.nom}
                onChange={(e) => handleSimulationNameChange(e.target.value)}
                className="mb-2 text-2xl font-bold h-auto border-none p-0 focus-visible:ring-0"
                placeholder="Nom de la simulation"
              />
              {simulation.adresse && (
                <p className="text-sm text-muted-foreground">
                  {simulation.adresse} • {simulation.codePostal} {simulation.ville}
                </p>
              )}
            </div>
            <ExportButton simulation={simulation} />
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="container mx-auto p-6 lg:flex lg:gap-6">
        <div className="flex-1 min-w-0">
          {/* Scenario Tabs */}
          <Tabs value={String(activeScenarioIdx)} onValueChange={(v) => setActiveScenarioIdx(Number(v))} className="mb-6">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
              {simulation.scenarios.map((scenario, idx) => (
                <TabsTrigger
                  key={scenario.id}
                  value={String(idx)}
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <span>{scenario.nom}</span>
                    <Badge variant="outline" className="text-xs">
                      {scenario.strategie === 'longue_duree' ? 'LD' : 'CD'}
                    </Badge>
                  </div>
                </TabsTrigger>
              ))}

              {/* Add Scenario Button */}
              <Dialog open={newScenarioDialog} onOpenChange={setNewScenarioDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un scénario</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Stratégie</Label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="longue_duree"
                            checked={newScenarioStrategy === 'longue_duree'}
                            onChange={(e) => setNewScenarioStrategy(e.target.value as 'longue_duree' | 'courte_duree')}
                            className="w-4 h-4"
                          />
                          <span>Longue durée (location classique)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="courte_duree"
                            checked={newScenarioStrategy === 'courte_duree'}
                            onChange={(e) => setNewScenarioStrategy(e.target.value as 'longue_duree' | 'courte_duree')}
                            className="w-4 h-4"
                          />
                          <span>Courte durée (Airbnb, etc.)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewScenarioDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddScenario}>Créer scénario</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsList>

            {/* Scenario Content */}
            {simulation.scenarios.map((scenario, idx) => (
              <TabsContent key={scenario.id} value={String(idx)}>
                {/* Section Tabs */}
                <Tabs value={activeSection} onValueChange={setActiveSection} className="mb-6">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="acquisition">Achat</TabsTrigger>
                    <TabsTrigger value="lots">Lots</TabsTrigger>
                    <TabsTrigger value="financement">Finance</TabsTrigger>
                    <TabsTrigger value="charges">Charges</TabsTrigger>
                    <TabsTrigger value="hypotheses">Hypothèses</TabsTrigger>
                    <TabsTrigger value="resultats">Résultats</TabsTrigger>
                  </TabsList>

                  {/* Acquisition Section */}
                  <TabsContent value="acquisition" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Acquisition et frais</CardTitle>
                        <CardDescription>
                          Définissez le prix d&apos;achat et tous les frais associés
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AcquisitionForm
                          scenario={scenario}
                          onUpdate={handleScenarioUpdate}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Lots Section */}
                  <TabsContent value="lots" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Gestion des lots</CardTitle>
                        <CardDescription>
                          Créez et gérez les unités de location
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <LotsForm
                          scenario={scenario}
                          onUpdate={handleScenarioUpdate}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Financement Section */}
                  <TabsContent value="financement" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Financement</CardTitle>
                        <CardDescription>
                          Configurez le crédit et l&apos;apport personnel
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FinancementForm
                          scenario={scenario}
                          onUpdate={handleScenarioUpdate}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Charges Section */}
                  <TabsContent value="charges" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Charges et taxes</CardTitle>
                        <CardDescription>
                          Tous les coûts d&apos;exploitation annuels
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChargesForm
                          scenario={scenario}
                          onUpdate={handleScenarioUpdate}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Hypothèses Section */}
                  <TabsContent value="hypotheses" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Hypothèses d&apos;exploitation</CardTitle>
                        <CardDescription>
                          Paramètres pour les projections
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <HypothesesForm
                          scenario={scenario}
                          onUpdate={handleScenarioUpdate}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Résultats Section */}
                  <TabsContent value="resultats" className="space-y-6">
                    {resultats && (
                      <div className="space-y-6">
                        {/* Investissement */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Investissement</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Investissement total</p>
                              <p className="text-2xl font-bold">
                                {formatNumber(resultats.investissementTotal)} €
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Apport total</p>
                              <p className="text-2xl font-bold">
                                {formatNumber(resultats.apportTotal)} €
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Revenus */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Revenus bruts annuels</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Annuel</p>
                              <p className="text-2xl font-bold">
                                {formatNumber(resultats.revenuBrutAnnuel)} €
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Mensuel</p>
                              <p className="text-2xl font-bold">
                                {formatNumber(resultats.revenuBrutMensuel)} €
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Charges */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Charges d&apos;exploitation</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Annuel</p>
                              <p className="text-2xl font-bold">
                                {formatNumber(resultats.chargesExploitationAnnuelles)} €
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Mensuel</p>
                              <p className="text-2xl font-bold">
                                {formatNumber(resultats.chargesExploitationMensuelles)} €
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Financement */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Charge de financement (mensuelle)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {formatNumber(resultats.chargeFinancementMensuelle)} €
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Mensualité: {formatNumber(resultats.financement.mensualiteAvecAssurance)} € (assurance comprise)
                            </p>
                          </CardContent>
                        </Card>

                        {/* Cash-flow */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Cash-flow (avant impôts)</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Annuel</p>
                              <p className={`text-2xl font-bold ${
                                resultats.cashFlowAnnuelAvantImpot >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {formatNumber(resultats.cashFlowAnnuelAvantImpot)} €
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Mensuel</p>
                              <p className={`text-2xl font-bold ${
                                resultats.cashFlowMensuelAvantImpot >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {formatNumber(resultats.cashFlowMensuelAvantImpot)} €
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Rendements */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Rendements</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 md:grid-cols-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Rendement brut</p>
                              <p className="text-2xl font-bold">
                                {resultats.rendementBrut.toFixed(2)} %
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Rendement net</p>
                              <p className="text-2xl font-bold">
                                {resultats.rendementNet.toFixed(2)} %
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Rendement net/net</p>
                              <p className="text-2xl font-bold">
                                {resultats.rendementNetNet.toFixed(2)} %
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Scenario Actions */}
                <div className="mt-6 flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => {
                    // Copy scenario
                    const newScenario = {
                      ...scenario,
                      id: `scenario-${Date.now()}`,
                      nom: `${scenario.nom} (copie)`
                    };
                    addScenario(simulation.id, newScenario);
                  }}>
                    <Copy className="w-4 h-4 mr-2" />
                    Dupliquer
                  </Button>
                  {simulation.scenarios.length > 1 && (
                    <Dialog open={deleteConfirm?.scenarioId === scenario.id} onOpenChange={(open) => {
                      if (!open) setDeleteConfirm(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirm({ scenarioId: scenario.id, deleteName: scenario.nom })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Supprimer le scénario</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          Êtes-vous sûr de vouloir supprimer &ldquo;{deleteConfirm?.deleteName}&rdquo; ? Cette action est irréversible.
                        </p>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Annuler
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteScenario(scenario.id)}
                          >
                            Supprimer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Sidebar - Résultats Summary (Desktop only) */}
        {resultats && (
          <div className="hidden lg:block lg:w-80 lg:sticky lg:top-6 lg:h-fit space-y-4">
            {/* Cash-flow hero */}
            <Card className={`border-2 ${
              resultats.cashFlowMensuelAvantImpot >= 0
                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
            }`}>
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Cash-flow mensuel</p>
                <p className={`text-3xl font-bold ${
                  resultats.cashFlowMensuelAvantImpot >= 0
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {resultats.cashFlowMensuelAvantImpot >= 0 ? '+' : ''}{formatNumber(resultats.cashFlowMensuelAvantImpot)} €
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  soit {resultats.cashFlowAnnuelAvantImpot >= 0 ? '+' : ''}{formatNumber(resultats.cashFlowAnnuelAvantImpot)} €/an avant impôts
                </p>
              </CardContent>
            </Card>

            {/* Rendements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Rendements</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Brut</p>
                  <p className="text-lg font-bold">{resultats.rendementBrut.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net</p>
                  <p className="text-lg font-bold">{resultats.rendementNet.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net-net</p>
                  <p className="text-lg font-bold">{resultats.rendementNetNet.toFixed(2)}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Flux financiers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Flux financiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenus bruts</span>
                  <span className="font-semibold">{formatNumber(resultats.revenuBrutAnnuel)} €/an</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charges</span>
                  <span className="font-semibold text-orange-600">-{formatNumber(resultats.chargesExploitationAnnuelles)} €/an</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crédit</span>
                  <span className="font-semibold text-orange-600">-{formatNumber(resultats.chargeFinancementAnnuelle)} €/an</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-muted-foreground font-medium">Cash-flow</span>
                  <span className={`font-bold ${
                    resultats.cashFlowAnnuelAvantImpot >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {resultats.cashFlowAnnuelAvantImpot >= 0 ? '+' : ''}{formatNumber(resultats.cashFlowAnnuelAvantImpot)} €/an
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Investissement */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Investissement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-lg">{formatNumber(resultats.investissementTotal)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apport</span>
                  <span className="font-semibold">{formatNumber(resultats.apportTotal)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mensualité crédit</span>
                  <span className="font-semibold">{formatNumber(resultats.chargeFinancementMensuelle)} €</span>
                </div>
                {resultats.cashOnCash !== 0 && (
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-muted-foreground text-xs">Cash-on-cash</span>
                    <span className="font-semibold text-xs">{resultats.cashOnCash.toFixed(2)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
