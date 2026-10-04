import { loadPricing } from './store';
import type { QuoteInput, QuoteResult, QtyBreakdown, PricingConfig, Material, Finishing, Shape } from './types';

export function getMaterialName(m: Material): string {
  return loadPricing().materials[m]?.name ?? m;
}

export function getFinishingName(f: Finishing): string {
  return loadPricing().finishings[f]?.name ?? f;
}

export function getShapeName(s: Shape): string {
  return loadPricing().shapes[s]?.name ?? s;
}

function unitPriceFor(cfg: PricingConfig, input: QuoteInput, quantity: number): number {
  const { labelWidth, labelHeight, material, fullColor, finishing, shape } = input;
  const areaSqm       = (labelWidth / 1000) * (labelHeight / 1000);
  const materialCost  = (cfg.materials[material]?.ratePerSqm  ?? 0) * areaSqm;
  const inkCost       = fullColor ? cfg.fullColorRate * areaSqm : 0;
  const finishingCost = (cfg.finishings[finishing]?.ratePerSqm ?? 0) * areaSqm;
  const shapeMulti    = cfg.shapes[shape]?.multiplier ?? 1;
  const sorted        = [...cfg.qtyBreaks].sort((a, b) => b.min - a.min);
  const qtyMulti      = sorted.find(b => quantity >= b.min)?.multiplier ?? 1.5;
  return Math.max((materialCost + inkCost + finishingCost) * shapeMulti * qtyMulti, 0.001);
}

function buildBreakdowns(cfg: PricingConfig, input: QuoteInput): QtyBreakdown[] {
  const setupFee = cfg.setupFeeEnabled ? cfg.setupFee : 0;
  const dieFee   = (input.shape === 'die-cut' && cfg.dieFeeEnabled) ? cfg.dieFee : 0;
  const minOrder = cfg.minOrderEnabled ? cfg.minOrderTotal : 0;
  return input.quantities.map(qty => {
    const unitPrice = unitPriceFor(cfg, input, qty);
    const subtotal  = unitPrice * qty;
    const total     = Math.max(subtotal + setupFee + dieFee, minOrder);
    return { quantity: qty, unitPrice, subtotal, total };
  });
}

export function estimatePrice(input: QuoteInput, cfg?: PricingConfig): QtyBreakdown[] | null {
  if (!input.labelWidth || !input.labelHeight || input.quantities.length === 0) return null;
  return buildBreakdowns(cfg ?? loadPricing(), input);
}

let quoteCounter = 0;

export function calculateQuote(input: QuoteInput, cfg?: PricingConfig, machineName = ''): QuoteResult {
  const config = cfg ?? loadPricing();

  const now = new Date();
  quoteCounter++;
  const seq      = String(quoteCounter).padStart(4, '0');
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const quoteNo  = `LQ-${datePart}-${seq}`;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });

  const validDate = new Date(now.getTime() + config.quoteValidityDays * 86_400_000);

  return {
    quoteNo,
    date:        fmtDate(now),
    validUntil:  fmtDate(validDate),
    setupFee:    config.setupFeeEnabled ? config.setupFee : 0,
    dieFee:      (input.shape === 'die-cut' && config.dieFeeEnabled) ? config.dieFee : 0,
    breakdowns:  buildBreakdowns(config, input),
    machineName,
  };
}
