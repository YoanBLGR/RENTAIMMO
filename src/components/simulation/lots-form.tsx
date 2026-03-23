'use client';

import { useState } from 'react';
import { Scenario, Lot } from '@/domain/types';
import { creerLotVide } from '@/domain/defaults';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface LotsFormProps {
  scenario: Scenario;
  onUpdate: (scenario: Scenario) => void;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num));
}

function parseNumber(str: string): number {
  return Number(str.replace(/\s/g, '')) || 0;
}

const LOT_TYPES = ['Studio', 'T1', 'T2', 'T3', 'T4+', 'Commerce', 'Autre'];

export default function LotsForm({ scenario, onUpdate }: LotsFormProps) {
  const [expandedLotId, setExpandedLotId] = useState<string | null>(
    scenario.lots.length === 1 ? scenario.lots[0].id : null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleLotUpdate = (updatedLot: Lot) => {
    const updated = {
      ...scenario,
      lots: scenario.lots.map((l) => (l.id === updatedLot.id ? updatedLot : l)),
    };
    onUpdate(updated);
  };

  const handleAddLot = () => {
    const newLot = creerLotVide();
    const updated = {
      ...scenario,
      lots: [...scenario.lots, newLot],
    };
    onUpdate(updated);
    setExpandedLotId(newLot.id);
  };

  const handleDeleteLot = (lotId: string) => {
    if (scenario.lots.length > 1) {
      const updated = {
        ...scenario,
        lots: scenario.lots.filter((l) => l.id !== lotId),
      };
      onUpdate(updated);
    }
    setDeleteConfirm(null);
  };

  const isLD = scenario.strategie === 'longue_duree';
  const isCD = scenario.strategie === 'courte_duree';

  return (
    <div className="space-y-4">
      {/* Lots List */}
      <div className="space-y-3">
        {scenario.lots.map((lot) => (
          <Collapsible
            key={lot.id}
            open={expandedLotId === lot.id}
            onOpenChange={(open) => setExpandedLotId(open ? lot.id : null)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4 hover:bg-muted"
              >
                <div className="flex items-center gap-3 text-left">
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform data-[state=open]:rotate-180" />
                  <div>
                    <p className="font-medium">{lot.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {lot.surface} m² • {lot.type} • Étage {lot.etage}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {isLD && `${formatNumber(lot.loyerMensuelLD)} €/mois`}
                  {isCD && `${formatNumber(lot.tarifNuiteeCD)} €/nuit`}
                </Badge>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 border border-border rounded-lg p-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`lot-nom-${lot.id}`}>Nom du lot</Label>
                  <Input
                    id={`lot-nom-${lot.id}`}
                    value={lot.nom}
                    onChange={(e) => handleLotUpdate({ ...lot, nom: e.target.value })}
                    placeholder="Appartement T2 RDC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`lot-type-${lot.id}`}>Type</Label>
                  <Select value={lot.type} onValueChange={(value: string) => handleLotUpdate({ ...lot, type: value })}>
                    <SelectTrigger id={`lot-type-${lot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`lot-surface-${lot.id}`}>Surface (m²)</Label>
                  <Input
                    id={`lot-surface-${lot.id}`}
                    type="number"
                    value={lot.surface}
                    onChange={(e) => handleLotUpdate({ ...lot, surface: parseNumber(e.target.value) })}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`lot-etage-${lot.id}`}>Étage</Label>
                  <Input
                    id={`lot-etage-${lot.id}`}
                    type="number"
                    value={lot.etage}
                    onChange={(e) => handleLotUpdate({ ...lot, etage: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <Separator />

              {/* LD-specific fields */}
              {isLD && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Longue durée</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`lot-loyer-${lot.id}`}>Loyer mensuel (charges comprises)</Label>
                      <Input
                        id={`lot-loyer-${lot.id}`}
                        type="number"
                        value={lot.loyerMensuelLD}
                        onChange={(e) => handleLotUpdate({ ...lot, loyerMensuelLD: parseNumber(e.target.value) })}
                        placeholder="800"
                        className="pr-8"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`lot-charges-rec-${lot.id}`}>Charges récupérables</Label>
                      <Input
                        id={`lot-charges-rec-${lot.id}`}
                        type="number"
                        value={lot.chargesRecuperablesLD}
                        onChange={(e) => handleLotUpdate({ ...lot, chargesRecuperablesLD: parseNumber(e.target.value) })}
                        placeholder="100"
                        className="pr-8"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CD-specific fields */}
              {isCD && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Courte durée</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`lot-tarif-${lot.id}`}>Tarif nuitée (€)</Label>
                      <Input
                        id={`lot-tarif-${lot.id}`}
                        type="number"
                        value={lot.tarifNuiteeCD}
                        onChange={(e) => handleLotUpdate({ ...lot, tarifNuiteeCD: parseNumber(e.target.value) })}
                        placeholder="80"
                        className="pr-8"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`lot-occupation-${lot.id}`}>Taux d'occupation</Label>
                      <div className="flex items-center gap-3 pt-2">
                        <Slider
                          id={`lot-occupation-${lot.id}`}
                          min={0}
                          max={100}
                          step={1}
                          value={[lot.tauxOccupationCD * 100]}
                          onValueChange={(val) =>
                            handleLotUpdate({ ...lot, tauxOccupationCD: val[0] / 100 })
                          }
                          className="flex-1"
                        />
                        <span className="text-sm font-medium min-w-12 text-right">
                          {Math.round(lot.tauxOccupationCD * 100)} %
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h5 className="text-sm font-medium">Charges par nuitée</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs" htmlFor={`lot-menage-${lot.id}`}>
                          Ménage (€)
                        </Label>
                        <Input
                          id={`lot-menage-${lot.id}`}
                          type="number"
                          value={lot.chargesMenageParNuitee}
                          onChange={(e) =>
                            handleLotUpdate({ ...lot, chargesMenageParNuitee: parseNumber(e.target.value) })
                          }
                          placeholder="15"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs" htmlFor={`lot-linge-${lot.id}`}>
                          Linge (€)
                        </Label>
                        <Input
                          id={`lot-linge-${lot.id}`}
                          type="number"
                          value={lot.chargesLingeParNuitee}
                          onChange={(e) =>
                            handleLotUpdate({ ...lot, chargesLingeParNuitee: parseNumber(e.target.value) })
                          }
                          placeholder="5"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs" htmlFor={`lot-consommables-${lot.id}`}>
                          Consommables (€)
                        </Label>
                        <Input
                          id={`lot-consommables-${lot.id}`}
                          type="number"
                          value={lot.chargesConsommablesParNuitee}
                          onChange={(e) =>
                            handleLotUpdate({ ...lot, chargesConsommablesParNuitee: parseNumber(e.target.value) })
                          }
                          placeholder="3"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor={`lot-commission-${lot.id}`}>Commission plateforme (%)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`lot-commission-${lot.id}`}
                        type="number"
                        value={lot.commissionPlateformeCD * 100}
                        onChange={(e) =>
                          handleLotUpdate({ ...lot, commissionPlateformeCD: parseNumber(e.target.value) / 100 })
                        }
                        placeholder="15"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Delete */}
              <div className="pt-2 border-t flex justify-end gap-2">
                {scenario.lots.length > 1 && (
                  <Dialog open={deleteConfirm === lot.id} onOpenChange={(open) => {
                    if (!open) setDeleteConfirm(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirm(lot.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Supprimer le lot</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">
                        Êtes-vous sûr de vouloir supprimer "{lot.nom}" ? Cette action est irréversible.
                      </p>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                          Annuler
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteLot(lot.id)}
                        >
                          Supprimer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Add Lot Button */}
      <Button onClick={handleAddLot} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter un lot
      </Button>
    </div>
  );
}
