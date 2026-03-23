# CLAUDE.md

## Product scope
- Le produit est spécialisé pour les immeubles de rapport en France.
- La cible principale est l’investisseur particulier avancé.
- Toute feature doit distinguer explicitement longue durée et courte durée.
- Le produit doit raisonner au niveau immeuble, lots, scénarios et consolidation d’actif.

## Technical rules
- Centraliser la logique métier et les calculs hors des composants UI.
- Garder les formules explicites, auditables et testables.
- Minimiser la création de fichiers et abstractions inutiles.
- Préserver une architecture simple, robuste et extensible.

## UX rules
- Utiliser shadcn/ui avec une interface premium, dense mais lisible.
- Prioriser clarté, crédibilité métier et comparabilité des scénarios.

## Working rules
- Lire les fichiers pertinents avant toute conclusion.
- Présenter un plan avant les gros changements.
- Signaler clairement hypothèses, risques et limites.
- Vérifier build, lint et tests quand c’est pertinent.