import type { QuoteInput, QuoteResult } from '../types';
import { getMaterialName } from '../pricing';
import { loadCompany } from '../store';

function labelDescription(input: QuoteInput): string {
  if (!input.fullColor && input.finishing === 'none') return 'Blank Label';
  if (input.fullColor) return 'Printed Label (Full Color)';
  return 'Printed Label';
}

export function generateTextQuote(input: QuoteInput, result: QuoteResult): string {
  const company = loadCompany();
  const lines: string[] = [];

  if (input.printerModel) {
    lines.push(`For Printer model: ${input.printerModel}`);
    lines.push('');
  }

  lines.push(labelDescription(input));
  lines.push(`• Size: ${input.labelWidth}mm W x ${input.labelHeight}mm H`);
  lines.push(`• Material: ${getMaterialName(input.material)}`);

  // Packing line
  const packingParts: string[] = [];
  if (input.packingPcsPerRoll) packingParts.push(`${input.packingPcsPerRoll.toLocaleString()}pcs/roll`);
  if (input.labelCore) packingParts.push(input.labelCore);
  if (packingParts.length > 0) lines.push(`• Packing: ${packingParts.join(', ')}`);

  lines.push(`• Colour: ${input.fullColor ? 'Full Color (CMYK)' : 'N/A'}`);

  const isRolls = input.quantityUnit === 'rolls' && input.packingPcsPerRoll > 0;

  if (result.breakdowns.length === 1) {
    const bd = result.breakdowns[0];
    if (isRolls && Number.isInteger(bd.quantity / input.packingPcsPerRoll)) {
      const rolls = bd.quantity / input.packingPcsPerRoll;
      const pricePerRoll = bd.total / rolls;
      lines.push(`• Qty: ${rolls} Roll${rolls !== 1 ? 's' : ''}`);
      lines.push(`• RM${pricePerRoll.toFixed(2)} per roll`);
    } else {
      lines.push(`• Qty: ${bd.quantity.toLocaleString()} pcs`);
      lines.push(`• RM${bd.unitPrice.toFixed(4)} per pcs`);
    }
  } else {
    lines.push('');
    lines.push('Pricing:');
    for (const bd of result.breakdowns) {
      if (isRolls && Number.isInteger(bd.quantity / input.packingPcsPerRoll)) {
        const rolls = bd.quantity / input.packingPcsPerRoll;
        const pricePerRoll = bd.total / rolls;
        lines.push(`• ${rolls} Roll${rolls !== 1 ? 's' : ''} (${bd.quantity.toLocaleString()} pcs) — RM${pricePerRoll.toFixed(2)}/roll (RM${bd.total.toFixed(2)} total)`);
      } else {
        lines.push(`• ${bd.quantity.toLocaleString()} pcs — RM${bd.unitPrice.toFixed(4)}/pcs (RM${bd.total.toFixed(2)} total)`);
      }
    }
  }

  if (input.notes.trim()) {
    lines.push('');
    lines.push(`Notes: ${input.notes.trim()}`);
  }

  lines.push('');
  lines.push(`Quote No: ${result.quoteNo}`);
  lines.push(`Valid Until: ${result.validUntil}`);

  if (company.name) {
    lines.push('');
    lines.push(company.name);
    if (company.phone) lines.push(company.phone);
    if (company.email) lines.push(company.email);
  }

  return lines.join('\n');
}

export function openEmailQuote(input: QuoteInput, result: QuoteResult): void {
  const text = generateTextQuote(input, result);
  const subject = encodeURIComponent(`Quotation ${result.quoteNo} – ${input.customerName}`);
  const body = encodeURIComponent(text);
  const to = input.customerEmail ? encodeURIComponent(input.customerEmail) : '';
  window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');
}
