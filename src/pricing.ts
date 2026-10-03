import { loadPricing } from './store';
import type { QuoteInput, QuoteResult, Material, Finishing, Shape } from './types';

export function getMaterialName(m: Material): string {
  return loadPricing().materials[m]?.name ?? m;
}

export function getFinishingName(f: Finishing): string {
  return loadPricing().finishings[f]?.name ?? f;
}

export function getShapeName(s: Shape): string {
  return loadPricing().shapes[s]?.name ?? s;
}

export interface PriceEstimate {
  unitPrice: number;
  setupFee: number;
  dieFee: number;
  subtotal: number;
  total: number;
}

export function estimatePrice(input: QuoteInput): PriceEstimate | null {
  if (!input.labelWidth || !input.labelHeight || !input.quantity || input.quantity < 1) return null;
  const cfg = loadPricing();
  const { labelWidth, labelHeight, material, quantity, fullColor, finishing, shape } = input;
  const areaCm2       = (labelWidth / 10) * (labelHeight / 10);
  const materialCost  = (cfg.materials[material]?.ratePerCm2  ?? 0) * areaCm2;
  const inkCost       = fullColor ? cfg.fullColorRate * areaCm2 : 0;
  const finishingCost = (cfg.finishings[finishing]?.ratePerCm2 ?? 0) * areaCm2;
  const shapeMulti    = cfg.shapes[shape]?.multiplier ?? 1;
  const sorted        = [...cfg.qtyBreaks].sort((a, b) => b.min - a.min);
  const qtyMulti      = sorted.find(b => quantity >= b.min)?.multiplier ?? 1.5;
  const unitPrice     = Math.max((materialCost + inkCost + finishingCost) * shapeMulti * qtyMulti, 0.001);
  const setupFee      = cfg.setupFee;
  const dieFee        = shape === 'die-cut' ? cfg.dieFee : 0;
  const subtotal      = unitPrice * quantity;
  const total         = Math.max(subtotal + setupFee + dieFee, cfg.minOrderTotal);
  return { unitPrice, setupFee, dieFee, subtotal, total };
}

let quoteCounter = 0;

export function calculateQuote(input: QuoteInput): QuoteResult {
  const cfg = loadPricing();
  const { labelWidth, labelHeight, material, quantity, fullColor, finishing, shape } = input;

  const areaCm2 = (labelWidth / 10) * (labelHeight / 10);

  const materialCost  = (cfg.materials[material]?.ratePerCm2  ?? 0) * areaCm2;
  const inkCost       = fullColor ? cfg.fullColorRate * areaCm2 : 0;
  const finishingCost = (cfg.finishings[finishing]?.ratePerCm2 ?? 0) * areaCm2;
  const shapeMulti    = cfg.shapes[shape]?.multiplier ?? 1;

  const sorted = [...cfg.qtyBreaks].sort((a, b) => b.min - a.min);
  const qtyMulti = sorted.find(b => quantity >= b.min)?.multiplier ?? 1.5;

  const unitPrice = Math.max(
    (materialCost + inkCost + finishingCost) * shapeMulti * qtyMulti,
    0.001
  );

  const setupFee = cfg.setupFee;
  const dieFee   = shape === 'die-cut' ? cfg.dieFee : 0;
  const subtotal = unitPrice * quantity;
  const total    = Math.max(subtotal + setupFee + dieFee, cfg.minOrderTotal);

  const now = new Date();
  quoteCounter++;
  const seq      = String(quoteCounter).padStart(4, '0');
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const quoteNo  = `LQ-${datePart}-${seq}`;

  const fmtDate  = (d: Date) =>
    d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });

  const validDate = new Date(now.getTime() + cfg.quoteValidityDays * 86_400_000);

  return {
    quoteNo,
    date: fmtDate(now),
    validUntil: fmtDate(validDate),
    unitPrice,
    setupFee,
    dieFee,
    subtotal,
    total,
  };
}
