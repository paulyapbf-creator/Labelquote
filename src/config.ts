// ─── Company Info (shown on PDF) ─────────────────────────────────────────────
export const COMPANY = {
  name: 'Your Company Name',
  address: 'No. 1, Jalan ABC, 12345 Kuala Lumpur, Malaysia',
  phone: '+60 12-345 6789',
  email: 'info@yourcompany.com',
  website: 'www.yourcompany.com',
  sstNo: '',           // e.g. 'W10-1234-12345678'  — leave blank if not applicable
  bankName: '',        // e.g. 'Maybank'
  bankAccount: '',     // e.g. '1234-5678-1234'
};

// ─── Pricing Config ───────────────────────────────────────────────────────────
// Material cost in RM per cm² of label area
export const MATERIAL_RATES: Record<string, { name: string; ratePerCm2: number }> = {
  'gloss-paper':  { name: 'Gloss White Paper',        ratePerCm2: 0.0030 },
  'matte-paper':  { name: 'Matte White Paper',        ratePerCm2: 0.0035 },
  'kraft-paper':  { name: 'Kraft Brown Paper',        ratePerCm2: 0.0030 },
  'gloss-vinyl':  { name: 'Gloss White Vinyl',        ratePerCm2: 0.0060 },
  'matte-vinyl':  { name: 'Matte White Vinyl',        ratePerCm2: 0.0070 },
  'clear-vinyl':  { name: 'Clear / Transparent Vinyl', ratePerCm2: 0.0080 },
  'silver-poly':  { name: 'Silver Polyester',         ratePerCm2: 0.0090 },
};

// Finishing cost in RM per cm²
export const FINISHING_RATES: Record<string, { name: string; ratePerCm2: number }> = {
  'none':      { name: 'No Lamination',     ratePerCm2: 0 },
  'gloss-lam': { name: 'Gloss Lamination',  ratePerCm2: 0.0010 },
  'matte-lam': { name: 'Matte Lamination',  ratePerCm2: 0.0012 },
};

// Shape names & price multipliers
export const SHAPE_CONFIG: Record<string, { name: string; multiplier: number }> = {
  'rectangle': { name: 'Rectangle / Square', multiplier: 1.00 },
  'rounded':   { name: 'Rounded Corner',     multiplier: 1.05 },
  'circle':    { name: 'Circle / Oval',      multiplier: 1.10 },
  'die-cut':   { name: 'Custom Die-Cut',     multiplier: 1.15 },
};

// Full color (CMYK) ink cost in RM per cm²
export const FULL_COLOR_RATE = 0.0025;

// Fixed fees (RM)
export const SETUP_FEE = 80;
export const DIE_FEE   = 50;   // only charged for custom die-cut
export const MIN_ORDER_TOTAL = 50;
export const MIN_QUANTITY = 100;

// Quantity break multipliers (lower = cheaper per label)
export const QTY_BREAKS: { min: number; multiplier: number }[] = [
  { min: 10000, multiplier: 0.65 },
  { min: 5000,  multiplier: 0.75 },
  { min: 2500,  multiplier: 0.85 },
  { min: 1000,  multiplier: 1.00 },
  { min: 500,   multiplier: 1.20 },
  { min: 0,     multiplier: 1.50 },
];

// Quote validity in days
export const QUOTE_VALIDITY_DAYS = 30;
