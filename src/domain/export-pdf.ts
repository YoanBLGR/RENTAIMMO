/**
 * PDF export engine for simulation reports
 * Pure logic — no UI code. Uses jsPDF + autoTable.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Simulation, Scenario, ResultatsScenario } from './types';
import { calculerResultatsScenario } from './calculs';

// ===== FORMATTING (standalone, no dependency on lib/format) =====

function fmt(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
    Math.round(value)
  );
}

function fmtEur(value: number): string {
  return `${fmt(value)} \u20AC`;
}

function fmtPct(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)} %`;
}

function fmtPctInput(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)} %`;
}

function strategieLabel(s: string): string {
  return s === 'longue_duree' ? 'Longue dur\u00e9e' : 'Courte dur\u00e9e';
}

function regimeFiscalLabel(r: string): string {
  const map: Record<string, string> = {
    micro_foncier: 'Micro-foncier',
    reel: 'R\u00e9el',
    lmnp_micro: 'LMNP Micro-BIC',
    lmnp_reel: 'LMNP R\u00e9el',
  };
  return map[r] || r;
}

// ===== COLORS =====

const COLORS = {
  primary: [15, 23, 42] as [number, number, number],       // slate-900
  accent: [59, 130, 246] as [number, number, number],       // blue-500
  accentLight: [239, 246, 255] as [number, number, number], // blue-50
  green: [22, 163, 74] as [number, number, number],         // green-600
  red: [220, 38, 38] as [number, number, number],           // red-600
  gray: [100, 116, 139] as [number, number, number],        // slate-500
  grayLight: [241, 245, 249] as [number, number, number],   // slate-100
  white: [255, 255, 255] as [number, number, number],
};

// ===== HELPERS =====

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 20, y);
  // Underline accent
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(20, y + 1.5, 20 + doc.getTextWidth(title), y + 1.5);
  return y + 10;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return 25;
  }
  return y;
}

function addKeyValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  opts?: { bold?: boolean; color?: [number, number, number] }
): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(label, x, y);

  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...(opts?.color || COLORS.primary));
  doc.text(value, x + 85, y);

  return y + 6;
}

// ===== COVER PAGE =====

function addCoverPage(doc: jsPDF, simulation: Simulation): void {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Background band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, w, 100, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text('Rapport de simulation', w / 2, 45, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(200, 210, 230);
  doc.text('Immeuble de rapport', w / 2, 58, { align: 'center' });

  // Simulation name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text(simulation.nom || 'Simulation', w / 2, 130, { align: 'center' });

  // Address
  if (simulation.adresse || simulation.ville) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.gray);
    const adresseLine = [
      simulation.adresse,
      [simulation.codePostal, simulation.ville].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(' \u2014 ');
    doc.text(adresseLine, w / 2, 142, { align: 'center' });
  }

  // Description
  if (simulation.description) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    const lines = doc.splitTextToSize(simulation.description, w - 80);
    doc.text(lines, w / 2, 158, { align: 'center' });
  }

  // Metadata at bottom
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`G\u00e9n\u00e9r\u00e9 le ${dateStr}`, w / 2, h - 40, {
    align: 'center',
  });
  doc.text(
    `${simulation.scenarios.length} sc\u00e9nario(s) analys\u00e9(s)`,
    w / 2,
    h - 32,
    { align: 'center' }
  );

  // Accent line
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(1);
  doc.line(w / 2 - 40, h - 46, w / 2 + 40, h - 46);
}

// ===== SCENARIO PAGES =====

function addScenarioSection(
  doc: jsPDF,
  scenario: Scenario,
  resultats: ResultatsScenario,
  index: number
): void {
  doc.addPage();
  let y = 20;

  // Scenario header band
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLORS.accentLight);
  doc.rect(0, 0, w, 35, 'F');
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(0, 35, w, 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text(`Sc\u00e9nario ${index + 1} : ${scenario.nom}`, 20, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.accent);
  doc.text(
    `Strat\u00e9gie : ${strategieLabel(scenario.strategie)}`,
    20,
    27
  );

  y = 45;

  // ===== KPI SUMMARY BOX =====
  y = checkPageBreak(doc, y, 45);
  doc.setFillColor(...COLORS.grayLight);
  doc.roundedRect(20, y, w - 40, 38, 3, 3, 'F');

  const kpiStartX = 30;
  const kpiSpacing = (w - 60) / 4;

  const kpis = [
    {
      label: 'Cash-flow mensuel',
      value: fmtEur(resultats.cashFlowMensuelAvantImpot),
      color:
        resultats.cashFlowMensuelAvantImpot >= 0 ? COLORS.green : COLORS.red,
    },
    { label: 'Rendement brut', value: fmtPct(resultats.rendementBrut), color: COLORS.primary },
    { label: 'Rendement net', value: fmtPct(resultats.rendementNet), color: COLORS.primary },
    { label: 'Rendement net/net', value: fmtPct(resultats.rendementNetNet), color: COLORS.primary },
  ];

  for (let i = 0; i < kpis.length; i++) {
    const kx = kpiStartX + i * kpiSpacing;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(kpis[i].label, kx, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...kpis[i].color);
    doc.text(kpis[i].value, kx, y + 25);
  }

  y += 48;

  // ===== ACQUISITION =====
  y = checkPageBreak(doc, y, 60);
  y = addSectionTitle(doc, 'Acquisition', y);

  const acq = scenario.acquisition;
  const fraisNotaire =
    acq.fraisNotaire > 0 ? acq.fraisNotaire : acq.prixAchat * acq.fraisNotairePct;

  y = addKeyValue(doc, 'Prix d\u2019achat', fmtEur(acq.prixAchat), 25, y, { bold: true });
  y = addKeyValue(doc, 'Frais de notaire', fmtEur(fraisNotaire), 25, y);
  if (acq.fraisAgence > 0) {
    y = addKeyValue(
      doc,
      `Frais d\u2019agence${acq.fraisAgenceInclus ? ' (FAI)' : ''}`,
      fmtEur(acq.fraisAgence),
      25,
      y
    );
  }
  if (acq.montantTravaux > 0) {
    y = addKeyValue(doc, 'Travaux', fmtEur(acq.montantTravaux), 25, y);
  }
  if (acq.montantAmeublement > 0) {
    y = addKeyValue(doc, 'Ameublement', fmtEur(acq.montantAmeublement), 25, y);
  }
  if (acq.autresFrais > 0) {
    y = addKeyValue(doc, 'Autres frais', fmtEur(acq.autresFrais), 25, y);
  }
  y = addKeyValue(doc, 'Investissement total', fmtEur(resultats.investissementTotal), 25, y, {
    bold: true,
    color: COLORS.accent,
  });
  y = addKeyValue(doc, 'Apport personnel', fmtEur(scenario.apportPersonnel), 25, y);
  y = addKeyValue(doc, 'Apport total (avec frais)', fmtEur(resultats.apportTotal), 25, y, {
    bold: true,
  });
  y += 4;

  // ===== LOTS =====
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, `Lots (${scenario.lots.length})`, y);

  const isCD = scenario.strategie === 'courte_duree';

  const lotsHead = isCD
    ? [['Lot', 'Type', 'Surface', '\u00c9tage', 'Tarif/nuit', 'Occup.', 'Revenu brut/an']]
    : [['Lot', 'Type', 'Surface', '\u00c9tage', 'Loyer/mois', 'Revenu brut/an']];

  const lotsBody = scenario.lots.map((lot, i) => {
    const lr = resultats.resultatsParLot[i];
    if (isCD) {
      return [
        lot.nom || `Lot ${i + 1}`,
        lot.type,
        `${fmt(lot.surface)} m\u00b2`,
        String(lot.etage),
        fmtEur(lot.tarifNuiteeCD),
        fmtPctInput(lot.tauxOccupationCD, 0),
        fmtEur(lr?.revenuBrutAnnuel || 0),
      ];
    }
    return [
      lot.nom || `Lot ${i + 1}`,
      lot.type,
      `${fmt(lot.surface)} m\u00b2`,
      String(lot.etage),
      fmtEur(lot.loyerMensuelLD),
      fmtEur(lr?.revenuBrutAnnuel || 0),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: lotsHead,
    body: lotsBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.primary },
    headStyles: {
      fillColor: COLORS.accent,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: COLORS.grayLight },
    margin: { left: 20, right: 20 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Total revenus bruts
  y = addKeyValue(
    doc,
    'Revenus bruts annuels',
    fmtEur(resultats.revenuBrutAnnuel),
    25,
    y,
    { bold: true, color: COLORS.accent }
  );
  y = addKeyValue(
    doc,
    'Revenus bruts mensuels',
    fmtEur(resultats.revenuBrutMensuel),
    25,
    y
  );
  y += 4;

  // ===== FINANCEMENT =====
  y = checkPageBreak(doc, y, 55);
  y = addSectionTitle(doc, 'Financement', y);

  const fin = scenario.financement;
  y = addKeyValue(doc, 'Montant du pr\u00eat', fmtEur(fin.montantPret), 25, y, { bold: true });
  y = addKeyValue(doc, 'Taux d\u2019int\u00e9r\u00eat', fmtPctInput(fin.tauxInteret), 25, y);
  y = addKeyValue(doc, 'Dur\u00e9e', `${fin.dureeMois} mois (${(fin.dureeMois / 12).toFixed(1)} ans)`, 25, y);
  if (fin.differeMois > 0) {
    y = addKeyValue(doc, 'Diff\u00e9r\u00e9', `${fin.differeMois} mois`, 25, y);
  }
  y = addKeyValue(
    doc,
    'Mensualit\u00e9 (assurance comprise)',
    fmtEur(resultats.financement.mensualiteAvecAssurance),
    25,
    y,
    { bold: true }
  );
  y = addKeyValue(doc, 'Co\u00fbt total du cr\u00e9dit', fmtEur(resultats.financement.coutTotalCredit), 25, y);
  y = addKeyValue(doc, 'dont int\u00e9r\u00eats', fmtEur(resultats.financement.coutTotalInterets), 25, y);
  y = addKeyValue(doc, 'dont assurance', fmtEur(resultats.financement.coutTotalAssurance), 25, y);
  y += 4;

  // ===== CHARGES =====
  y = checkPageBreak(doc, y, 60);
  y = addSectionTitle(doc, 'Charges d\u2019exploitation', y);

  const dc = resultats.detailCharges;
  const chargesData: [string, number][] = [
    ['Taxe fonci\u00e8re', dc.taxeFonciere],
    ['Assurances (PNO + GLI)', dc.assurances],
    ['Entretien', dc.entretien],
    ['Gestion locative', dc.gestionLocative],
    ['Comptabilit\u00e9', dc.comptabilite],
    ['Copropri\u00e9t\u00e9', dc.copropriete],
  ];
  if (isCD) {
    chargesData.push(['CFE', dc.cfe]);
    chargesData.push(['Charges lots CD', dc.chargesLotsCourtesDuree]);
  }
  if (dc.autresCharges > 0) {
    chargesData.push(['Autres charges', dc.autresCharges]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Poste', 'Montant annuel']],
    body: [
      ...chargesData
        .filter(([, v]) => v > 0)
        .map(([label, value]) => [label, fmtEur(value)]),
      [
        { content: 'TOTAL', styles: { fontStyle: 'bold' as const } },
        {
          content: fmtEur(resultats.chargesExploitationAnnuelles),
          styles: { fontStyle: 'bold' as const },
        },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.primary },
    headStyles: {
      fillColor: COLORS.accent,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: COLORS.grayLight },
    margin: { left: 20, right: 20 },
    columnStyles: { 1: { halign: 'right' } },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ===== HYPOTHESES =====
  y = checkPageBreak(doc, y, 45);
  y = addSectionTitle(doc, 'Hypoth\u00e8ses d\u2019exploitation', y);

  const hyp = scenario.hypotheses;
  if (!isCD) {
    y = addKeyValue(doc, 'Taux de vacance locative', fmtPctInput(hyp.tauxVacanceLD), 25, y);
  }
  y = addKeyValue(doc, 'Revalorisation loyers/an', fmtPctInput(hyp.revalorisationLoyersAnnuelle), 25, y);
  y = addKeyValue(doc, 'Revalorisation charges/an', fmtPctInput(hyp.revalorisationChargesAnnuelle), 25, y);
  y = addKeyValue(doc, 'Dur\u00e9e de d\u00e9tention', `${hyp.dureeDetention} ans`, 25, y);
  y = addKeyValue(doc, 'TMI', fmtPctInput(hyp.tauxImposition), 25, y);
  y = addKeyValue(doc, 'R\u00e9gime fiscal', regimeFiscalLabel(hyp.regimeFiscal), 25, y);
  y += 4;

  // ===== RESULTATS SYNTHESE =====
  y = checkPageBreak(doc, y, 55);
  y = addSectionTitle(doc, 'Synth\u00e8se financi\u00e8re', y);

  autoTable(doc, {
    startY: y,
    body: [
      ['Revenus bruts annuels', fmtEur(resultats.revenuBrutAnnuel)],
      ['Charges d\u2019exploitation annuelles', `- ${fmtEur(resultats.chargesExploitationAnnuelles)}`],
      ['Charge de financement annuelle', `- ${fmtEur(resultats.chargeFinancementAnnuelle)}`],
      [
        {
          content: 'Cash-flow annuel avant imp\u00f4ts',
          styles: { fontStyle: 'bold' as const, fontSize: 10 },
        },
        {
          content: fmtEur(resultats.cashFlowAnnuelAvantImpot),
          styles: {
            fontStyle: 'bold' as const,
            fontSize: 10,
            textColor:
              resultats.cashFlowAnnuelAvantImpot >= 0 ? COLORS.green : COLORS.red,
          },
        },
      ],
      [
        {
          content: 'Cash-flow mensuel avant imp\u00f4ts',
          styles: { fontStyle: 'bold' as const, fontSize: 10 },
        },
        {
          content: fmtEur(resultats.cashFlowMensuelAvantImpot),
          styles: {
            fontStyle: 'bold' as const,
            fontSize: 10,
            textColor:
              resultats.cashFlowMensuelAvantImpot >= 0 ? COLORS.green : COLORS.red,
          },
        },
      ],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 4, textColor: COLORS.primary },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 20, right: 20 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Rendements
  y = checkPageBreak(doc, y, 30);

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Rendement brut', fmtPct(resultats.rendementBrut)],
      ['Rendement net', fmtPct(resultats.rendementNet)],
      ['Rendement net/net (sur apport)', fmtPct(resultats.rendementNetNet)],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, textColor: COLORS.primary },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
    },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 20, right: 20 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ===== AMORTIZATION TABLE (yearly summary) =====
  const tableau = resultats.financement.tableauAmortissement;
  if (tableau.length > 0) {
    y = checkPageBreak(doc, y, 50);
    y = addSectionTitle(doc, 'Tableau d\u2019amortissement (r\u00e9sum\u00e9 annuel)', y);

    const yearlyData: [string, string, string, string, string][] = [];
    const totalMonths = tableau.length;
    const yearsCount = Math.ceil(totalMonths / 12);

    for (let year = 0; year < yearsCount; year++) {
      const startMonth = year * 12;
      const endMonth = Math.min(startMonth + 12, totalMonths);
      let capitalRembourse = 0;
      let interetsPaies = 0;
      let assurancePaye = 0;

      for (let m = startMonth; m < endMonth; m++) {
        capitalRembourse += tableau[m].partCapital;
        interetsPaies += tableau[m].partInterets;
        assurancePaye += tableau[m].assurance;
      }

      const capitalRestant = tableau[endMonth - 1].capitalRestant;

      yearlyData.push([
        `Ann\u00e9e ${year + 1}`,
        fmtEur(capitalRembourse),
        fmtEur(interetsPaies),
        fmtEur(assurancePaye),
        fmtEur(capitalRestant),
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [['P\u00e9riode', 'Capital rembours\u00e9', 'Int\u00e9r\u00eats', 'Assurance', 'Capital restant']],
      body: yearlyData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2.5, textColor: COLORS.primary },
      headStyles: {
        fillColor: COLORS.accent,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: COLORS.grayLight },
      margin: { left: 20, right: 20 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });
  }
}

// ===== COMPARISON PAGE =====

function addComparaisonPage(
  doc: jsPDF,
  scenarios: Scenario[],
  resultatsAll: ResultatsScenario[]
): void {
  if (resultatsAll.length < 2) return;

  doc.addPage();
  const w = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, w, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Comparaison des sc\u00e9narios', w / 2, 18, { align: 'center' });

  y = 42;

  // Comparison table
  const head = [
    ['Indicateur', ...resultatsAll.map((r) => r.scenarioNom)],
  ];

  const rows = [
    ['Strat\u00e9gie', ...resultatsAll.map((r) => strategieLabel(r.strategie))],
    ['Investissement total', ...resultatsAll.map((r) => fmtEur(r.investissementTotal))],
    ['Apport total', ...resultatsAll.map((r) => fmtEur(r.apportTotal))],
    ['Revenus bruts annuels', ...resultatsAll.map((r) => fmtEur(r.revenuBrutAnnuel))],
    ['Charges annuelles', ...resultatsAll.map((r) => fmtEur(r.chargesExploitationAnnuelles))],
    ['Financement mensuel', ...resultatsAll.map((r) => fmtEur(r.chargeFinancementMensuelle))],
    ['Cash-flow annuel', ...resultatsAll.map((r) => fmtEur(r.cashFlowAnnuelAvantImpot))],
    ['Cash-flow mensuel', ...resultatsAll.map((r) => fmtEur(r.cashFlowMensuelAvantImpot))],
    ['Rendement brut', ...resultatsAll.map((r) => fmtPct(r.rendementBrut))],
    ['Rendement net', ...resultatsAll.map((r) => fmtPct(r.rendementNet))],
    ['Rendement net/net', ...resultatsAll.map((r) => fmtPct(r.rendementNetNet))],
  ];

  autoTable(doc, {
    startY: y,
    head,
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, textColor: COLORS.primary },
    headStyles: {
      fillColor: COLORS.accent,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: COLORS.grayLight },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
    },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Best performers
  y = checkPageBreak(doc, y, 30);
  y = addSectionTitle(doc, 'Meilleurs sc\u00e9narios', y);

  const bestCashFlow = resultatsAll.reduce((a, b) =>
    a.cashFlowAnnuelAvantImpot >= b.cashFlowAnnuelAvantImpot ? a : b
  );
  const bestRendBrut = resultatsAll.reduce((a, b) =>
    a.rendementBrut >= b.rendementBrut ? a : b
  );
  const bestRendNet = resultatsAll.reduce((a, b) =>
    a.rendementNet >= b.rendementNet ? a : b
  );

  y = addKeyValue(
    doc,
    'Meilleur cash-flow',
    `${bestCashFlow.scenarioNom} (${fmtEur(bestCashFlow.cashFlowMensuelAvantImpot)}/mois)`,
    25,
    y,
    { bold: true, color: COLORS.green }
  );
  y = addKeyValue(
    doc,
    'Meilleur rendement brut',
    `${bestRendBrut.scenarioNom} (${fmtPct(bestRendBrut.rendementBrut)})`,
    25,
    y,
    { bold: true }
  );
  y = addKeyValue(
    doc,
    'Meilleur rendement net',
    `${bestRendNet.scenarioNom} (${fmtPct(bestRendNet.rendementNet)})`,
    25,
    y,
    { bold: true }
  );
}

// ===== FOOTER =====

function addFooters(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Line
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.3);
    doc.line(20, h - 15, w - 20, h - 15);

    // Page number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Page ${i - 1} / ${totalPages - 1}`, w / 2, h - 8, {
      align: 'center',
    });

    // Brand
    doc.text('RENTAIMMO', 20, h - 8);
  }
}

// ===== MAIN EXPORT =====

export function genererRapportPDF(simulation: Simulation): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Cover page
  addCoverPage(doc, simulation);

  // Calculate results for all scenarios
  const resultatsAll = simulation.scenarios.map(calculerResultatsScenario);

  // Individual scenario pages
  simulation.scenarios.forEach((scenario, index) => {
    addScenarioSection(doc, scenario, resultatsAll[index], index);
  });

  // Comparison page (if multiple scenarios)
  addComparaisonPage(doc, simulation.scenarios, resultatsAll);

  // Footers on all pages
  addFooters(doc);

  // Download
  const fileName = `RENTAIMMO_${(simulation.nom || 'simulation')
    .replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_')
    .replace(/_+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(fileName);
}
