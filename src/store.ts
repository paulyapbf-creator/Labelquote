import type { SavedQuote, QuoteStatus, CompanyInfo, PricingConfig, QuoteInput } from './types';

const QUOTES_KEY  = 'labelquote_quotes';
const COMPANY_KEY = 'labelquote_company';

// ── Quotes ────────────────────────────────────────────────────────────────────

export function loadQuotes(): SavedQuote[] {
  try {
    const raw = localStorage.getItem(QUOTES_KEY);
    if (!raw) return [];
    const quotes = JSON.parse(raw) as SavedQuote[];
    // Migrate old quotes: quantity (number) → quantities ([number])
    return quotes.map(q => {
      let inp = q.input as QuoteInput & { quantity?: number };
      // Migrate: quantity (number) → quantities ([number])
      if (inp.quantity !== undefined && !inp.quantities) {
        const { quantity, ...rest } = inp;
        inp = { ...rest, quantities: [quantity] } as QuoteInput;
      }
      // Migrate: missing quantityUnit defaults to 'pcs'
      if (!inp.quantityUnit) {
        inp = { ...inp, quantityUnit: 'pcs' };
      }
      return { ...q, input: inp };
    });
  } catch {
    return [];
  }
}

function saveAll(quotes: SavedQuote[]): void {
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

export function saveQuote(quote: SavedQuote): void {
  const quotes = loadQuotes();
  const idx = quotes.findIndex(q => q.id === quote.id);
  if (idx >= 0) {
    quotes[idx] = { ...quote, updatedAt: new Date().toISOString() };
  } else {
    quotes.unshift(quote);
  }
  saveAll(quotes);
}

export function deleteQuote(id: string): void {
  saveAll(loadQuotes().filter(q => q.id !== id));
}

export function updateQuoteStatus(id: string, status: QuoteStatus): void {
  const quotes = loadQuotes();
  const idx = quotes.findIndex(q => q.id === id);
  if (idx >= 0) {
    quotes[idx] = { ...quotes[idx], status, updatedAt: new Date().toISOString() };
    saveAll(quotes);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Company Info ──────────────────────────────────────────────────────────────

const COMPANY_DEFAULTS: CompanyInfo = {
  name:        'Your Company Name',
  address:     'No. 1, Jalan ABC, 12345 Kuala Lumpur, Malaysia',
  phone:       '+60 12-345 6789',
  email:       'info@yourcompany.com',
  website:     '',
  sstNo:       '',
  bankName:    '',
  bankAccount: '',
};

export function loadCompany(): CompanyInfo {
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    return raw ? { ...COMPANY_DEFAULTS, ...JSON.parse(raw) } : COMPANY_DEFAULTS;
  } catch {
    return COMPANY_DEFAULTS;
  }
}

export function saveCompany(info: CompanyInfo): void {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(info));
}

// ── Pricing Config ────────────────────────────────────────────────────────────

const PRICING_KEY = 'labelquote_pricing';

const PRICING_DEFAULTS: PricingConfig = {
  materials: {
    'gloss-paper': { name: 'Gloss White Paper',         ratePerSqm: 30 },
    'matte-paper': { name: 'Matte White Paper',         ratePerSqm: 35 },
    'kraft-paper': { name: 'Kraft Brown Paper',         ratePerSqm: 30 },
    'gloss-vinyl': { name: 'Gloss White Vinyl',         ratePerSqm: 60 },
    'matte-vinyl': { name: 'Matte White Vinyl',         ratePerSqm: 70 },
    'clear-vinyl': { name: 'Clear / Transparent Vinyl', ratePerSqm: 80 },
    'silver-poly': { name: 'Silver Polyester',          ratePerSqm: 90 },
  },
  finishings: {
    'none':      { name: 'No Lamination',    ratePerSqm: 0 },
    'gloss-lam': { name: 'Gloss Lamination', ratePerSqm: 10 },
    'matte-lam': { name: 'Matte Lamination', ratePerSqm: 12 },
  },
  shapes: {
    'rectangle': { name: 'Rectangle / Square', multiplier: 1.00 },
    'rounded':   { name: 'Rounded Corner',     multiplier: 1.05 },
    'circle':    { name: 'Circle / Oval',      multiplier: 1.10 },
    'die-cut':   { name: 'Custom Die-Cut',     multiplier: 1.15 },
  },
  fullColorRate:     25,
  setupFee:          80,
  setupFeeEnabled:   true,
  dieFee:            50,
  dieFeeEnabled:     true,
  minOrderTotal:     50,
  minOrderEnabled:   true,
  minQuantity:       100,
  quoteValidityDays: 30,
  qtyBreaks: [
    { min: 10000, multiplier: 0.65 },
    { min: 5000,  multiplier: 0.75 },
    { min: 2500,  multiplier: 0.85 },
    { min: 1000,  multiplier: 1.00 },
    { min: 500,   multiplier: 1.20 },
    { min: 0,     multiplier: 1.50 },
  ],
};

export function loadPricing(): PricingConfig {
  try {
    const raw = localStorage.getItem(PRICING_KEY);
    return raw ? { ...PRICING_DEFAULTS, ...JSON.parse(raw) } : PRICING_DEFAULTS;
  } catch {
    return PRICING_DEFAULTS;
  }
}

export function savePricing(config: PricingConfig): void {
  localStorage.setItem(PRICING_KEY, JSON.stringify(config));
}
