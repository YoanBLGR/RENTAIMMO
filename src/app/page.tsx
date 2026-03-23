'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useSimulationStore } from '@/store/simulation-store';
import { calculerResultatsScenario } from '@/domain/calculs';
import { creerSimulationBeauvais } from '@/domain/defaults';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Plus,
  Copy,
  Trash2,
  MapPin,
  Calendar,
  TrendingUp,
  FileUp,
  Landmark,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ImportAnnonce } from '@/components/simulation/import-annonce';

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function Dashboard() {
  const router = useRouter();
  const { state, createSimulation, deleteSimulation, duplicateSimulation } = useSimulationStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleDuplicate = (id: string) => {
    const newId = `sim-${Date.now()}`;
    duplicateSimulation(id, newId);
    router.push(`/simulation/${newId}`);
  };

  const handleCreateBeauvais = () => {
    const sim = creerSimulationBeauvais();
    createSimulation(sim);
    router.push(`/simulation/${sim.id}`);
  };

  const handleDeleteConfirm = (id: string) => {
    deleteSimulation(id);
    setDeleteDialogOpen(null);
  };

  if (!state.loaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Mes simulations</h1>
          <Badge variant="secondary">{state.simulations.length}</Badge>
        </div>
        <p className="text-muted-foreground">
          Gérez vos simulations d&apos;investissement immobilier
        </p>
        <div className="flex gap-2 mt-4">
          <Button asChild>
            <Link href="/simulation/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle simulation
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            Importer une annonce
          </Button>
          <Button variant="outline" onClick={handleCreateBeauvais}>
            <Landmark className="h-4 w-4 mr-2" />
            Preset Beauvais
          </Button>
        </div>
      </div>

      <ImportAnnonce open={importDialogOpen} onOpenChange={setImportDialogOpen} />

      {state.simulations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-3">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-1">
                  Aucune simulation
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Commencez par créer une nouvelle simulation pour analyser
                  votre investissement.
                </p>
                <Button asChild>
                  <Link href="/simulation/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une simulation
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {state.simulations.map((simulation) => {
            const results =
              simulation.scenarios.length > 0
                ? simulation.scenarios.map(calculerResultatsScenario)
                : [];

            const bestCashFlow =
              results.length > 0
                ? Math.max(...results.map((r) => r.cashFlowMensuelAvantImpot))
                : 0;

            const bestRendementBrut =
              results.length > 0
                ? Math.max(...results.map((r) => r.rendementBrut))
                : 0;

            return (
              <Card key={simulation.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg">{simulation.nom}</CardTitle>
                    <Badge
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {simulation.scenarios.length}{' '}
                      {simulation.scenarios.length === 1 ? 'scénario' : 'scénarios'}
                    </Badge>
                  </div>
                  {simulation.adresse && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{simulation.adresse}</span>
                    </div>
                  )}
                  {simulation.dateCreation && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(simulation.dateCreation)}</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  {results.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <div className="rounded-lg bg-muted p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            Meilleur rendement brut
                          </span>
                          <TrendingUp className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-lg font-semibold">
                          {formatPercent(bestRendementBrut, 2)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            Meilleur cash-flow mensuel
                          </span>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(bestCashFlow)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="border-t px-6 py-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => router.push(`/simulation/${simulation.id}`)}
                  >
                    Ouvrir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(simulation.id)}
                    title="Dupliquer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Dialog open={deleteDialogOpen === simulation.id} onOpenChange={(open) => {
                    if (open) setDeleteDialogOpen(simulation.id);
                    else setDeleteDialogOpen(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Supprimer la simulation</DialogTitle>
                        <DialogDescription>
                          Êtes-vous sûr de vouloir supprimer &ldquo;{simulation.nom}&rdquo; ?
                          Cette action ne peut pas être annulée.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteConfirm(simulation.id)}
                        >
                          Supprimer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
