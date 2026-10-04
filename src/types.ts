export type Shape = 'rectangle' | 'rounded' | 'circle' | 'die-cut';
export type Material = 'gloss-paper' | 'matte-paper' | 'kraft-paper' | 'gloss-vinyl' | 'matte-vinyl' | 'clear-vinyl' | 'silver-poly';
export type Finishing = 'none' | 'gloss-lam' | 'matte-lam';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface PricingConfig {
  materials:        Record<string, { name: string; ratePerSqm: number }>;
  finishings:       Record<string, { name: string; ratePerSqm: number }>;
  shapes:           Record<string, { name: string; multiplier: number }>;
  fullColorRate:    number;
  setupFee:         number;
  dieFee:           number;
  minOrderTotal:    number;
  minQuantity:      number;
  qtyBreaks:        { min: number; multiplier: number }[];
  quoteValidityDays: number;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  sstNo: string;
  bankName: string;
  bankAccount: string;
}

export interface QuoteInput {
  customerName: string;
  customerContact: string;
  labelWidth: number;
  labelHeight: number;
  shape: Shape;
  material: Material;
  quantity: number;
  fullColor: boolean;
  finishing: Finishing;
  printerModel: string;
  labelCore: string;
  packingPcsPerRoll: number;
  notes: string;
}

export interface QuoteResult {
  quoteNo: string;
  date: string;
  validUntil: string;
  unitPrice: number;
  setupFee: number;
  dieFee: number;
  subtotal: number;
  total: number;
}

export interface SavedQuote {
  id: string;
  status: QuoteStatus;
  input: QuoteInput;
  result: QuoteResult;
  createdAt: string;
  updatedAt: string;
}
