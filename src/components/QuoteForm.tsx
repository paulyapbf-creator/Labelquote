import { Fragment, useState, useMemo } from 'react';
import type { QuoteInput, Shape, Material, Finishing, QtyBreakdown } from '../types';
import { estimatePrice } from '../pricing';

const SHAPES: { value: Shape; label: string; icon: string }[] = [
  { value: 'rectangle', label: 'Rectangle', icon: '▬' },
  { value: 'rounded',   label: 'Rounded',   icon: '▢' },
  { value: 'circle',    label: 'Circle',    icon: '⬤' },
  { value: 'die-cut',   label: 'Die-Cut',   icon: '✦' },
];

const MATERIALS: { value: Material; label: string; sub: string; swatch: string }[] = [
  { value: 'gloss-paper', label: 'Gloss Paper',    sub: 'Standard, cost-effective',  swatch: 'bg-white ring-2 ring-gray-200' },
  { value: 'matte-paper', label: 'Matte Paper',    sub: 'Softer, writable surface',  swatch: 'bg-gray-200' },
  { value: 'kraft-paper', label: 'Kraft Paper',    sub: 'Eco / organic look',        swatch: 'bg-amber-400' },
  { value: 'gloss-vinyl', label: 'Gloss Vinyl',    sub: 'Waterproof, durable',       swatch: 'bg-sky-200' },
  { value: 'matte-vinyl', label: 'Matte Vinyl',    sub: 'Waterproof, no-glare',      swatch: 'bg-slate-300' },
  { value: 'clear-vinyl', label: 'Clear Vinyl',    sub: 'See-through labels',        swatch: 'bg-transparent ring-2 ring-dashed ring-purple-300' },
  { value: 'silver-poly', label: 'Silver Poly',    sub: 'Premium metallic finish',   swatch: 'bg-zinc-400' },
];

const FINISHINGS: { value: Finishing; label: string; sub: string }[] = [
  { value: 'none',      label: 'None',  sub: 'No lamination' },
  { value: 'gloss-lam', label: 'Gloss', sub: 'Shiny finish'  },
  { value: 'matte-lam', label: 'Matte', sub: 'Soft finish'   },
];

const QTY_PRESETS = [500, 1000, 2500, 5000, 10000];
const PACKING_PRESETS = [250, 500, 1000, 2000];
const CORE_OPTIONS = ['1"', '1.5"', '3"'];

const DEFAULT: QuoteInput = {
  customerName: '',
  customerContact: '',
  labelWidth: 50,
  labelHeight: 50,
  shape: 'rectangle',
  material: 'gloss-paper',
  quantities: [1000],
  fullColor: true,
  finishing: 'none',
  printerModel: '',
  labelCore: '1"',
  packingPcsPerRoll: 1000,
  notes: '',
};

type Errors = Partial<Record<keyof QuoteInput, string>>;

interface Props {
  initial?: QuoteInput;
  onSubmit: (input: QuoteInput) => void;
}

export function QuoteForm({ initial, onSubmit }: Props) {
  const [form, setForm] = useState<QuoteInput>(initial ?? DEFAULT);
  const [errors, setErrors] = useState<Errors>({});

  const estimate = useMemo(() => estimatePrice(form), [form]);

  function set<K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function toggleQty(qty: number) {
    setForm(prev => {
      const exists = prev.quantities.includes(qty);
      const next = exists
        ? prev.quantities.filter(q => q !== qty)
        : [...prev.quantities, qty].sort((a, b) => a - b);
      return { ...prev, quantities: next };
    });
    setErrors(prev => ({ ...prev, quantities: undefined }));
  }

  function addCustomQty(qty: number) {
    if (!qty || qty < 1) return;
    setForm(prev => ({
      ...prev,
      quantities: prev.quantities.includes(qty)
        ? prev.quantities
        : [...prev.quantities, qty].sort((a, b) => a - b),
    }));
    setErrors(prev => ({ ...prev, quantities: undefined }));
  }

  function validate(): boolean {
    const e: Errors = {};
    if (!form.customerName.trim())               e.customerName = 'Required';
    if (!form.labelWidth  || form.labelWidth < 1)  e.labelWidth  = 'Enter valid width';
    if (!form.labelHeight || form.labelHeight < 1) e.labelHeight = 'Enter valid height';
    if (form.quantities.length === 0)              (e as Record<string, string>).quantities = 'Select at least one quantity';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  const inputCls = (err?: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${err ? 'border-red-400' : 'border-gray-200'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-6">

      {/* Customer */}
      <Section icon="👤" title="Customer">
        <Field label="Name *" error={errors.customerName}>
          <input type="text" value={form.customerName}
            onChange={e => set('customerName', e.target.value)}
            placeholder="Company or individual name"
            className={inputCls(errors.customerName)} />
        </Field>
        <Field label="Phone / Email">
          <input type="text" value={form.customerContact}
            onChange={e => set('customerContact', e.target.value)}
            placeholder="Optional"
            className={inputCls()} />
        </Field>
      </Section>

      {/* Size & Shape */}
      <Section icon="📐" title="Size & Shape">
        <Field label="Label Size (mm)" error={errors.labelWidth ?? errors.labelHeight}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input type="number" value={form.labelWidth || ''}
                onChange={e => set('labelWidth', Number(e.target.value))}
                placeholder="Width" min="1"
                className={inputCls(errors.labelWidth)} />
              <p className="text-xs text-gray-400 mt-0.5 text-center">Width</p>
            </div>
            <span className="text-gray-400 text-xl pb-5 select-none">×</span>
            <div className="flex-1">
              <input type="number" value={form.labelHeight || ''}
                onChange={e => set('labelHeight', Number(e.target.value))}
                placeholder="Height" min="1"
                className={inputCls(errors.labelHeight)} />
              <p className="text-xs text-gray-400 mt-0.5 text-center">Height</p>
            </div>
            {form.labelWidth > 0 && form.labelHeight > 0 && (
              <div className="w-12 h-12 shrink-0 flex items-center justify-center pb-5">
                <div
                  className="border-2 border-blue-400 bg-blue-50 rounded-sm"
                  style={{
                    width:  `${Math.min(44, Math.round(44 * Math.min(form.labelWidth, form.labelHeight) / Math.max(form.labelWidth, form.labelHeight, 1)))}px`,
                    height: `${Math.min(44, Math.round(44 * Math.min(form.labelHeight, form.labelWidth) / Math.max(form.labelHeight, form.labelWidth, 1)))}px`,
                  }}
                />
              </div>
            )}
          </div>
        </Field>

        <Field label="Shape">
          <div className="grid grid-cols-4 gap-2">
            {SHAPES.map(s => (
              <button key={s.value} type="button" onClick={() => set('shape', s.value)}
                className={`flex flex-col items-center py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  form.shape === s.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                <span className="text-sm mb-0.5">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Material */}
      <Section icon="🏷️" title="Material">
        <div className="grid grid-cols-2 gap-2">
          {MATERIALS.map(m => (
            <button key={m.value} type="button" onClick={() => set('material', m.value)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                form.material === m.value
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-200'
              }`}>
              <span className={`w-5 h-5 rounded-full shrink-0 ${m.swatch}`} />
              <div className="min-w-0">
                <p className={`text-xs font-semibold leading-tight ${form.material === m.value ? 'text-blue-700' : 'text-gray-700'}`}>
                  {m.label}
                </p>
                <p className="text-xs text-gray-400 leading-tight truncate">{m.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Quantity */}
      <Section icon="🔢" title="Quantity Tiers">
        <p className="text-xs text-gray-400 -mt-1">Select one or more quantities to include in this quote.</p>
        <div className="flex flex-wrap gap-2">
          {QTY_PRESETS.map(q => (
            <button key={q} type="button" onClick={() => toggleQty(q)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                form.quantities.includes(q)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
              }`}>
              {q.toLocaleString()}
            </button>
          ))}
        </div>
        <CustomQtyInput onAdd={addCustomQty} existing={form.quantities} />
        {(errors as Record<string, string>).quantities && (
          <p className="text-xs text-red-500">{(errors as Record<string, string>).quantities}</p>
        )}
        {form.quantities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {form.quantities.map(q => (
              <span key={q} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                {q.toLocaleString()}
                <button type="button" onClick={() => toggleQty(q)}
                  className="text-blue-400 hover:text-blue-700 leading-none">×</button>
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Roll Specifications */}
      <Section icon="🎞️" title="Roll Specifications">
        <Field label="Printer Model">
          <input type="text" value={form.printerModel}
            onChange={e => set('printerModel', e.target.value)}
            placeholder="e.g. Zebra ZT410, TSC TTP-244"
            className={inputCls()} />
        </Field>

        <Field label="Label Core">
          <div className="flex gap-2">
            {CORE_OPTIONS.map(c => (
              <button key={c} type="button" onClick={() => set('labelCore', c)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  form.labelCore === c
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                {c}
              </button>
            ))}
            <input type="text" value={CORE_OPTIONS.includes(form.labelCore) ? '' : form.labelCore}
              onChange={e => set('labelCore', e.target.value)}
              placeholder="Custom"
              className="flex-1 rounded-xl border border-gray-200 px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Core inner diameter</p>
        </Field>

        <Field label="Packing (pcs / roll)">
          <input type="number" value={form.packingPcsPerRoll || ''}
            onChange={e => set('packingPcsPerRoll', Number(e.target.value))}
            placeholder="e.g. 1000" min="1"
            className={inputCls()} />
          <div className="flex flex-wrap gap-2 mt-2">
            {PACKING_PRESETS.map(p => (
              <button key={p} type="button" onClick={() => set('packingPcsPerRoll', p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.packingPcsPerRoll === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                }`}>
                {p.toLocaleString()}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Print & Finishing */}
      <Section icon="🎨" title="Print & Finishing">
        <button type="button" onClick={() => set('fullColor', !form.fullColor)}
          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
            form.fullColor ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
          }`}>
          <div className="text-left">
            <p className={`text-sm font-semibold ${form.fullColor ? 'text-blue-700' : 'text-gray-700'}`}>
              Full Color (CMYK)
            </p>
            <p className="text-xs text-gray-400">4-color process printing</p>
          </div>
          <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            form.fullColor ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              form.fullColor ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </span>
        </button>

        <Field label="Lamination">
          <div className="grid grid-cols-3 gap-2">
            {FINISHINGS.map(f => (
              <button key={f.value} type="button" onClick={() => set('finishing', f.value)}
                className={`flex flex-col items-center py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  form.finishing === f.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                <span className="font-semibold">{f.label}</span>
                <span className={`text-xs mt-0.5 ${form.finishing === f.value ? 'text-blue-200' : 'text-gray-400'}`}>
                  {f.sub}
                </span>
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Notes */}
      <Section icon="📝" title="Notes">
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Special requirements, delivery details, artwork notes…"
          rows={2}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white" />
      </Section>

      {/* Live Estimate */}
      {estimate && estimate.length > 0 && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-md">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">Live Estimate</p>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1.5 text-sm">
            <span className="text-xs text-blue-300 font-semibold">Quantity</span>
            <span className="text-xs text-blue-300 font-semibold text-right">Unit Price</span>
            <span className="text-xs text-blue-300 font-semibold text-right">Total</span>
            {estimate.map((bd: QtyBreakdown) => (
              <Fragment key={bd.quantity}>
                <span className="text-blue-100">{bd.quantity.toLocaleString()} pcs</span>
                <span className="text-right font-mono">RM {bd.unitPrice.toFixed(4)}</span>
                <span className="text-right font-semibold">RM {bd.total.toFixed(2)}</span>
              </Fragment>
            ))}
          </div>
          {estimate[0].total > estimate[0].subtotal && (
            <p className="text-xs text-blue-300 mt-2">* Total includes setup / one-time fees</p>
          )}
        </div>
      )}

      <button type="submit"
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-sm flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Save Quote
      </button>
    </form>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function CustomQtyInput({ onAdd, existing }: { onAdd: (qty: number) => void; existing: number[] }) {
  const [val, setVal] = useState('');
  function handleAdd() {
    const n = Number(val);
    if (n >= 1 && !existing.includes(n)) {
      onAdd(n);
      setVal('');
    }
  }
  return (
    <div className="flex gap-2 mt-1">
      <input
        type="number" value={val} min="1" placeholder="Custom qty…"
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <button type="button" onClick={handleAdd}
        className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors whitespace-nowrap">
        + Add
      </button>
    </div>
  );
}
