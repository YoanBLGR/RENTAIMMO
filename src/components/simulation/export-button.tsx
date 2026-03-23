'use client';

import { Button } from '@/components/ui/button';
import { Simulation } from '@/domain/types';
import { FileDown } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonProps {
  simulation: Simulation;
}

export default function ExportButton({ simulation }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Dynamic import to avoid loading jspdf in the initial bundle
      const { genererRapportPDF } = await import('@/domain/export-pdf');
      genererRapportPDF(simulation);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <FileDown className="w-4 h-4 mr-2" />
      {loading ? 'Export en cours...' : 'Exporter PDF'}
    </Button>
  );
}
