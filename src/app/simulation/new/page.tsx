'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimulationStore } from '@/store/simulation-store';
import { creerSimulationVide } from '@/domain/defaults';

export default function NouvelleSimulation() {
  const { createSimulation } = useSimulationStore();
  const router = useRouter();

  useEffect(() => {
    const sim = creerSimulationVide();
    createSimulation(sim);
    router.replace(`/simulation/${sim.id}`);
  }, [createSimulation, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Création de la simulation...</p>
    </div>
  );
}
