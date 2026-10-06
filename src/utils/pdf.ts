import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuoteInput, QuoteResult } from '../types';
import { getMaterialName, getFinishingName, getShapeName } from '../pricing';
import { loadCompany } from '../store';
import { BUILD_LABEL } from '../version';

// jspdf-autotable adds lastAutoTable to jsPDF instance
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

const BLUE  = [37, 99, 235] as [number, number, number];
const DARK  = [17, 24, 39]  as [number, number, number];
const GRAY  = [107, 114, 128] as [number, number, number];
const LIGHT = [249, 250, 251] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];

export function generatePDF(input: QuoteInput, result: QuoteResult): void {
  const COMPANY = loadCompany();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPDFWithAutoTable;
  const W = doc.internal.pageSize.getWidth();
  const M = 18; // margin

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY.name, M, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(COMPANY.address, M, 20);
  doc.text(`${COMPANY.phone}   ${COMPANY.email}`, M, 25);
  if (COMPANY.sstNo) doc.text(`SST No: ${COMPANY.sstNo}`, M, 30);

  // QUOTATION label (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('QUOTATION', W - M, 18, { align: 'right' });

  // ── Quote meta ─────────────────────────────────────────────────────────────
  let y = 46;
  doc.setTextColor(...DARK);
  doc.setFontSize(8.5);

  const metaRows: [string, string][] = [
    ['Quote No', result.quoteNo],
    ['Date', result.date],
    ['Valid Until', result.validUntil],
  ];

  metaRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, M, y);
    doc.setFont('helvetica', 'normal');
    doc.text(val, M + 26, y);
    y += 5.5;
  });

  // ── Bill To ────────────────────────────────────────────────────────────────
  y += 2;
  const billH = input.customerContact ? 20 : 15;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, y, W - M * 2, billH, 2, 2, 'F');

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('BILL TO', M + 4, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text(input.customerName, M + 4, y);

  if (input.customerContact) {
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(input.customerContact, M + 4, y);
  }

  y += 9;

  // ── Specifications table ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text('LABEL SPECIFICATIONS', M, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    body: [
      ['Label Size',    `${input.labelWidth} × ${input.labelHeight} mm`],
      ['Shape',         getShapeName(input.shape)],
      ['Material',      getMaterialName(input.material)],
      ['Color',         input.fullColor ? 'Full Color (CMYK)' : 'Single Color'],
      ['Finishing',     getFinishingName(input.finishing)],
      ['Quantity', (() => {
        const byRolls = input.quantityUnit === 'rolls' && input.packingPcsPerRoll > 0;
        return input.quantities.map(q => {
          if (byRolls) {
            const r = q / input.packingPcsPerRoll;
            if (Number.isInteger(r)) return `${r} roll${r !== 1 ? 's' : ''} (${q.toLocaleString()} pcs)`;
          }
          return `${q.toLocaleString()} pcs`;
        }).join(', ');
      })()],
      ['Printer Model', input.printerModel || '—'],
      ['Label Core',    input.labelCore || '—'],
      ['Packing',       input.packingPcsPerRoll ? `${input.packingPcsPerRoll.toLocaleString()} pcs / roll` : '—'],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38, fillColor: [243, 244, 246] },
    },
    styles:      { fontSize: 8.5, cellPadding: 2.8 },
    theme:       'plain',
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.25,
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Pricing table ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PRICING BREAKDOWN', M, y);
  y += 2;

  const labelDesc = `${input.labelWidth}×${input.labelHeight}mm · ${getMaterialName(input.material)}`;

  // Fixed fees row (if any)
  const feeRows: string[][] = [];
  if (result.setupFee > 0) {
    feeRows.push(['Setup / Plate Fee', '', '', `RM ${result.setupFee.toFixed(2)}`]);
  }
  if (result.dieFee > 0) {
    feeRows.push(['Custom Die-Cut Fee', '', '', `RM ${result.dieFee.toFixed(2)}`]);
  }

  const pricingRows: string[][] = result.breakdowns.map(bd => {
    const byRolls = input.quantityUnit === 'rolls' && input.packingPcsPerRoll > 0;
    const r = bd.quantity / input.packingPcsPerRoll;
    const isRollRow = byRolls && Number.isInteger(r);
    const qtyCell = isRollRow
      ? `${r} roll${r !== 1 ? 's' : ''}\n(${bd.quantity.toLocaleString()} pcs)`
      : bd.quantity.toLocaleString();
    const unitPriceCell = isRollRow
      ? `RM ${(bd.unitPrice * input.packingPcsPerRoll).toFixed(2)}/roll`
      : `RM ${bd.unitPrice.toFixed(4)}/pcs`;
    return [labelDesc, qtyCell, unitPriceCell, `RM ${bd.total.toFixed(2)}`];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: [...pricingRows, ...feeRows],
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
    },
    headStyles: {
      fillColor: BLUE,
      textColor: WHITE,
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles:  { fontSize: 8.5 },
    theme:   'striped',
  });

  y = doc.lastAutoTable.finalY;

  // Price range bar
  const minTotal = Math.min(...result.breakdowns.map(b => b.total));
  const maxTotal = Math.max(...result.breakdowns.map(b => b.total));
  const totalLabel = result.breakdowns.length > 1
    ? `RM ${minTotal.toFixed(2)} – RM ${maxTotal.toFixed(2)}`
    : `RM ${minTotal.toFixed(2)}`;
  const totalW = result.breakdowns.length > 1 ? 80 : 58;
  doc.setFillColor(...BLUE);
  doc.rect(W - M - totalW, y, totalW, 9, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL', W - M - totalW + 3, y + 6.2);
  doc.text(totalLabel, W - M - 2, y + 6.2, { align: 'right' });

  y += 16;

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (input.notes.trim()) {
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('NOTES', M, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(input.notes.trim(), W - M * 2);
    doc.text(lines, M, y);
    y += (lines.length as number) * 4.5 + 6;
  }

  // ── Terms ─────────────────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, y, W - M * 2, 34, 2, 2, 'F');

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('TERMS & CONDITIONS', M + 4, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  const terms = [
    '1. This quotation is valid for 30 days from the date issued.',
    '2. A 50% deposit is required to confirm the order.',
    '3. Balance payment is due upon completion, before delivery or collection.',
    '4. Customer to provide print-ready artwork in AI, PDF or high-resolution format.',
    '5. Prices are subject to change after the validity period.',
  ];
  terms.forEach(t => {
    doc.text(t, M + 4, y);
    y += 4.2;
  });

  if (COMPANY.bankName) {
    y += 1;
    doc.setFont('helvetica', 'bold');
    doc.text(`Bank: ${COMPANY.bankName}   Account: ${COMPANY.bankAccount}`, M + 4, y);
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Thank you for your business!', W / 2, pageH - 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(BUILD_LABEL, W / 2, pageH - 6, { align: 'center' });

  doc.save(`${result.quoteNo}.pdf`);
}
