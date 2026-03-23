'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSimulationStore } from '@/store/simulation-store';
import { creerSimulationDepuisImport } from '@/domain/defaults';
import type { ImportAnnonceResult } from '@/domain/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

type ImportState = 'idle' | 'loading' | 'success' | 'error';

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ACCEPTED_EXTENSIONS = '.pdf,.txt,.docx';

interface ImportAnnonceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportAnnonce({ open, onOpenChange }: ImportAnnonceProps) {
  const router = useRouter();
  const { createSimulation } = useSimulationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ImportState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setErrorMessage('');
    setText('');
    setFileName(null);
    setFile(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!ACCEPTED_TYPES.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|txt|docx)$/i)) {
      setState('error');
      setErrorMessage('Format non supporté. Utilisez PDF, TXT ou DOCX.');
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setText(''); // Clear text if a file is selected
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() && !file) return;

    setState('loading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }

      const response = await fetch('/api/import-annonce', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur serveur');
      }

      const importData = result as ImportAnnonceResult;
      const simulation = creerSimulationDepuisImport(importData);
      createSimulation(simulation);

      setState('success');

      // Redirect after a brief delay to show success state
      setTimeout(() => {
        handleClose(false);
        router.push(`/simulation/${simulation.id}`);
      }, 800);
    } catch (err: unknown) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de l'import");
    }
  }, [text, file, createSimulation, router, handleClose]);

  const canSubmit = (text.trim().length > 0 || file !== null) && state !== 'loading';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer une annonce</DialogTitle>
          <DialogDescription>
            Collez le texte d&apos;une annonce ou glissez un fichier pour cr&eacute;er automatiquement une simulation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors
              ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
              ${fileName ? 'bg-muted/50' : ''}
            `}
          >
            {fileName ? (
              <>
                <FileText className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">{fileName}</p>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setFileName(null);
                  }}
                >
                  Supprimer
                </button>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Glissez un fichier ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-muted-foreground/70">PDF, TXT ou DOCX</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Textarea */}
          <Textarea
            placeholder="Collez le texte de l'annonce ici (LeBonCoin, SeLoger, etc.)"
            rows={6}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.trim()) {
                setFile(null);
                setFileName(null);
              }
            }}
            disabled={state === 'loading'}
          />

          {/* Status messages */}
          {state === 'error' && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
          {state === 'success' && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>Simulation cr&eacute;&eacute;e avec succ&egrave;s ! Redirection...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={state === 'loading'}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {state === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Importer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
