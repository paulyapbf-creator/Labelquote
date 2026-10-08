# LabelQuote — Project Blueprint

**Version:** Auto-versioned (`major.minor.{commitCount}`)
**Deployment:** Railway — `https://labelquote-production.up.railway.app`
**Repository:** `https://github.com/paulyapbf-creator/Labelquote`

---

## 1. Purpose

LabelQuote is a mobile-first Progressive Web App (PWA) for generating professional roll-label sticker quotations. It targets label printing businesses in Malaysia, allowing sales staff to quickly quote customers on-site or in the office — with no backend required. All data is stored locally in the browser (localStorage).

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| PDF Generation | jsPDF + jspdf-autotable |
| PWA | vite-plugin-pwa (Workbox) |
| Server (prod) | Node.js `server.js` (static file server) |
| Deployment | Railway (nixpacks builder) |
| Storage | Browser localStorage (no database) |

---

## 3. Architecture

```
Browser (PWA)
│
├── localStorage
│   ├── labelquote_quotes      — saved quotes
│   ├── labelquote_company     — company info + default CC email
│   ├── labelquote_pricing     — default pricing config
│   ├── labelquote_profiles    — machine pricing profiles
│   ├── labelquote_contacts    — customer contact book
│   └── labelquote_emails      — recently used email addresses
│
├── React SPA (src/)
│   ├── App.tsx                — router/view controller
│   ├── types.ts               — all TypeScript interfaces
│   ├── store.ts               — localStorage CRUD + migrations
│   ├── pricing.ts             — pricing calculation engine
│   ├── version.ts             — build label constants
│   ├── buildinfo.json         — stamped version/hash/date
│   │
│   ├── components/
│   │   ├── QuoteList          — dashboard: list + stats
│   │   ├── QuoteForm          — new/edit quote form
│   │   ├── QuoteSummary       — quote detail + actions
│   │   ├── Settings           — company info + default CC email
│   │   ├── PricingSettings    — pricing config editor (generic)
│   │   ├── MachineProfiles    — per-machine pricing profiles
│   │   └── CustomerContacts   — customer contact book
│   │
│   └── utils/
│       ├── pdf.ts             — PDF quotation generator (jsPDF)
│       └── textQuote.ts       — plain-text/WhatsApp format + mailto
│
└── server.js                  — production static file server (Node.js)
```

---

## 4. Data Model

### QuoteInput
```typescript
{
  customerName: string
  customerContact: string        // phone
  customerEmail: string          // email (saved to contact history)
  pricingProfileId: string       // '' = default rates
  labelWidth: number             // mm
  labelHeight: number            // mm
  shape: 'rectangle' | 'rounded' | 'circle' | 'die-cut'
  material: Material
  quantities: number[]           // always stored in pcs
  quantityUnit: 'pcs' | 'rolls'  // display unit
  fullColor: boolean
  finishing: 'none' | 'gloss-lam' | 'matte-lam'
  printerModel: string           // customer's label printer
  labelCore: string              // e.g. '1"', '3"'
  packingPcsPerRoll: number
  notes: string
}
```

### QuoteResult
```typescript
{
  quoteNo: string                // e.g. LQ-20261008-0001
  date: string
  validUntil: string
  setupFee: number
  dieFee: number
  machineName: string            // from selected pricing profile
  breakdowns: QtyBreakdown[]     // one per quantity tier
}
```

### QtyBreakdown
```typescript
{
  quantity: number               // pcs
  unitPrice: number              // per pcs (display converts to /roll)
  subtotal: number
  total: number
}
```

### PricingProfile
```typescript
{
  id: string
  name: string                   // e.g. 'Zebra ZT411'
  config: PricingConfig          // full independent pricing config
}
```

### CustomerContact
```typescript
{
  id: string
  name: string
  email: string
  phone: string
}
```

---

## 5. Pricing Engine (`src/pricing.ts`)

```
Unit Price = (materialCost + inkCost + finishingCost)
             × shapeMultiplier
             × qtyBreakMultiplier
```

- **materialCost** = material rate (RM/m²) × label area (m²)
- **inkCost** = fullColor rate (RM/m²) × area (if full color)
- **finishingCost** = lamination rate (RM/m²) × area
- **shapeMultiplier** = per-shape cost factor (die-cut costs more)
- **qtyBreakMultiplier** = tiered discount (higher qty = lower multiplier)

Fixed fees (setup, die-cut, min order) applied on top per tier.

Pricing config is **per machine profile** — each profile stores a complete independent `PricingConfig`. Passing no profile uses the global default.

---

## 6. Navigation / Views

```
list           — quote dashboard (default)
new            — new quote form
edit/{id}      — edit existing quote
view/{id}      — quote summary + actions
settings       — company info, default CC email
machine-profiles — list of machine pricing profiles
profile-edit/{id} — pricing editor for a specific machine (or default)
contacts       — customer contact book
```

---

## 7. Quotation Output Formats

### PDF (`src/utils/pdf.ts`)
- A4 portrait, jsPDF + autotable
- Header: company branding (blue band)
- Bill To: customer name + contact
- Label Specifications table
- Pricing Breakdown table (per quantity tier)
  - Qty shown as rolls when unit = rolls
  - Unit price shown as RM/roll when unit = rolls
- Terms & conditions
- Footer: "Thank you for your business!" + build version label

### Plain Text / WhatsApp (`src/utils/textQuote.ts`)
```
For Printer model: Zebra ZT411

Blank Label
• Size: 100mm W x 100mm H
• Material: Matt Paper
• Packing: 1,000pcs/roll, 3" core
• Colour: N/A
• Qty: 10 Rolls
• RM42.00 per roll

Quote No: LQ-20261008-0001
Valid Until: 07 Nov 2026

Your Company Sdn. Bhd.
+60 12-345 6789
```

---

## 8. Email Flow

1. User taps **Email** on Quote Summary
2. Contact picker modal opens (slide-up)
3. Shows: quote's own customer email + saved contacts (searchable)
4. User selects a contact or types an email
5. `mailto:` link opens device email client with:
   - **To:** selected email
   - **CC:** company's Default CC Email (from Settings)
   - **Subject:** `Quotation LQ-XXXXXXXX-XXXX – Customer Name`
   - **Body:** plain-text quote format

---

## 9. Build Versioning

Format: **`v{major}.{minor}.{commitCount} ({gitHash}) · {date}`**

- `major.minor` set manually in `package.json`
- `patch` = total git commit count (auto-increments)
- `gitHash` = short SHA of HEAD commit
- `date` = build date

### How it works
- `scripts/stamp.cjs` reads git and writes `src/buildinfo.json`
- `vite.config.ts` reads `buildinfo.json` at build time (Railway has no git)
- Local builds override with live git data if available
- Stamp is run before every push to keep Railway's version accurate

### Shown in
- App header (main list screen)
- Settings page footer
- PDF quotation footer

---

## 10. Deployment

### Railway Configuration (`railway.toml`)
```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "node server.js"
restartPolicyType = "on_failure"
healthcheckPath = "/"
healthcheckTimeout = 300
```

### `server.js`
Plain Node.js static file server. Reads `process.env.PORT` (set by Railway). Serves `dist/` with SPA fallback (all unknown paths → `index.html`).

### Push Workflow
```bash
# Make changes, then:
node scripts/stamp.cjs          # stamp version into src/buildinfo.json
git add .
git commit -m "..."
git push                        # triggers Railway auto-deploy via GitHub
# or:
railway up --detach             # manual deploy from CLI
```

---

## 11. Known Issues / Limitations

| Issue | Status |
|---|---|
| All data in localStorage — no sync across devices | By design (offline-first) |
| Railway 502 on `labelquote-production-2415.up.railway.app` | Under investigation — proxy routing issue |
| Email uses `mailto:` — cannot attach PDF automatically | Platform limitation |
| No user authentication | Single-user app by design |

---

## 12. Future Enhancements (Backlog)

- Cloud sync / backup (export/import JSON)
- Customer portal link to view quotation online
- WhatsApp direct share button
- Multi-user / team support
- Invoice generation from accepted quotes
- Artwork upload / attachment per quote
