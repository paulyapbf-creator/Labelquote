import { Fragment, useState } from 'react';
import type { PricingConfig } from '../types';
import { loadPricing, savePricing } from '../store';

interface Props {
  onBack: () => void;
  loadConfig?: () => PricingConfig;
  saveConfig?: (c: PricingConfig) => void;
  savedMessage?: string;
}

export function PricingSettings({ onBack: _onBack, loadConfig, saveConfig, savedMessage }: Props) {
  const [cfg, setCfg] = useState<PricingConfig>(() =>
    JSON.parse(JSON.stringify((loadConfig ?? loadPricing)()))
  );
  const [saved, setSaved] = useState(false);

  function markChanged() { setSaved(false); }

  function setFixed<K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: value }));
    markChanged();
  }

  function setMaterialField(key: string, field: 'name' | 'ratePerSqm', value: string | number) {
    setCfg(prev => ({
      ...prev,
      materials: { ...prev.materials, [key]: { ...prev.materials[key], [field]: value } },
    }));
    markChanged();
  }

  function setFinishingField(key: string, field: 'name' | 'ratePerSqm', value: string | number) {
    setCfg(prev => ({
      ...prev,
      finishings: { ...prev.finishings, [key]: { ...prev.finishings[key], [field]: value } },
    }));
    markChanged();
  }

  function setShapeMultiplier(key: string, value: number) {
    setCfg(prev => ({
      ...prev,
      shapes: { ...prev.shapes, [key]: { ...prev.shapes[key], multiplier: value } },
    }));
    markChanged();
  }

  function setQtyBreak(idx: number, field: 'min' | 'multiplier', value: number) {
    setCfg(prev => {
      const breaks = [...prev.qtyBreaks];
      breaks[idx] = { ...breaks[idx], [field]: value };
      return { ...prev, qtyBreaks: breaks };
    });
    markChanged();
  }

  function addQtyBreak() {
    setCfg(prev => ({
      ...prev,
      qtyBreaks: [...prev.qtyBreaks, { min: 0, multiplier: 1.0 }],
    }));
    markChanged();
  }

  function removeQtyBreak(idx: number) {
    setCfg(prev => ({
      ...prev,
      qtyBreaks: prev.qtyBreaks.filter((_, i) => i !== idx),
    }));
    markChanged();
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    (saveConfig ?? savePricing)(cfg);
    setSaved(true);
  }

  const numCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right';
  const txtCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <form onSubmit={handleSave} className="space-y-4 pb-8">

      {/* Fixed fees */}
      <Section title="Fixed Fees">
        <FeeRow
          label="Setup / Plate Fee"
          enabled={cfg.setupFeeEnabled}
          amount={cfg.setupFee}
          onToggle={v => setFixed('setupFeeEnabled', v)}
          onAmount={v => setFixed('setupFee', v)}
        />
        <FeeRow
          label="Die-Cut Fee"
          enabled={cfg.dieFeeEnabled}
          amount={cfg.dieFee}
          onToggle={v => setFixed('dieFeeEnabled', v)}
          onAmount={v => setFixed('dieFee', v)}
        />
        <FeeRow
          label="Min. Order Total"
          enabled={cfg.minOrderEnabled}
          amount={cfg.minOrderTotal}
          onToggle={v => setFixed('minOrderEnabled', v)}
          onAmount={v => setFixed('minOrderTotal', v)}
        />
        <InlineRow label="Min. Quantity (pcs)">
          <input type="number" value={cfg.minQuantity} min="1" step="1"
            onChange={e => setFixed('minQuantity', Number(e.target.value))}
            className={numCls} />
        </InlineRow>
        <InlineRow label="Quote Validity (days)">
          <input type="number" value={cfg.quoteValidityDays} min="1" step="1"
            onChange={e => setFixed('quoteValidityDays', Number(e.target.value))}
            className={numCls} />
        </InlineRow>
      </Section>

      {/* Full color */}
      <Section title="Full Color (CMYK) Ink">
        <InlineRow label="Ink rate (RM / m²)">
          <input type="number" value={cfg.fullColorRate} min="0" step="0.0001"
            onChange={e => setFixed('fullColorRate', Number(e.target.value))}
            className={numCls} />
        </InlineRow>
      </Section>

      {/* Materials */}
      <Section title="Material Rates (RM / m²)">
        <p className="text-xs text-gray-400 -mt-1">Rate per m² of label area</p>
        <div className="grid grid-cols-[1fr_90px] gap-x-2 gap-y-2 items-center">
          <span className="text-xs font-semibold text-gray-400">Material Name</span>
          <span className="text-xs font-semibold text-gray-400 text-right">RM / m²</span>
          {Object.entries(cfg.materials).map(([key, mat]) => (
            <Fragment key={key}>
              <input type="text" value={mat.name}
                onChange={e => setMaterialField(key, 'name', e.target.value)}
                className={txtCls} />
              <input type="number" value={mat.ratePerSqm} min="0" step="0.0001"
                onChange={e => setMaterialField(key, 'ratePerSqm', Number(e.target.value))}
                className={numCls} />
            </Fragment>
          ))}
        </div>
      </Section>

      {/* Finishing */}
      <Section title="Lamination Rates (RM / m²)">
        <div className="grid grid-cols-[1fr_90px] gap-x-2 gap-y-2 items-center">
          <span className="text-xs font-semibold text-gray-400">Finishing Name</span>
          <span className="text-xs font-semibold text-gray-400 text-right">RM / m²</span>
          {Object.entries(cfg.finishings).map(([key, fin]) => (
            <Fragment key={key}>
              <input type="text" value={fin.name}
                onChange={e => setFinishingField(key, 'name', e.target.value)}
                className={txtCls} />
              <input type="number" value={fin.ratePerSqm} min="0" step="0.0001"
                onChange={e => setFinishingField(key, 'ratePerSqm', Number(e.target.value))}
                className={numCls} />
            </Fragment>
          ))}
        </div>
      </Section>

      {/* Shape multipliers */}
      <Section title="Shape Multipliers">
        <p className="text-xs text-gray-400 -mt-1">Multiplied on top of base cost (1.0 = no change)</p>
        {Object.entries(cfg.shapes).map(([key, shape]) => (
          <InlineRow key={key} label={shape.name}>
            <input type="number" value={shape.multiplier} min="0" step="0.01"
              onChange={e => setShapeMultiplier(key, Number(e.target.value))}
              className={numCls} />
          </InlineRow>
        ))}
      </Section>

      {/* Quantity breaks */}
      <Section title="Quantity Break Multipliers">
        <p className="text-xs text-gray-400 -mt-1">Highest matching min qty wins. Lower multiplier = cheaper per label.</p>
        <div className="grid grid-cols-[1fr_90px_32px] gap-x-2 gap-y-2 items-center mt-1">
          <span className="text-xs font-semibold text-gray-400">Min. Qty (pcs)</span>
          <span className="text-xs font-semibold text-gray-400 text-right">Multiplier</span>
          <span />
          {cfg.qtyBreaks.map((b, i) => (
            <Fragment key={i}>
              <input type="number" value={b.min} min="0" step="1"
                onChange={e => setQtyBreak(i, 'min', Number(e.target.value))}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input type="number" value={b.multiplier} min="0" step="0.01"
                onChange={e => setQtyBreak(i, 'multiplier', Number(e.target.value))}
                className={numCls} />
              <button type="button" onClick={() => removeQtyBreak(i)}
                className="h-10 w-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 text-lg leading-none">
                ×
              </button>
            </Fragment>
          ))}
        </div>
        <button type="button" onClick={addQtyBreak}
          className="mt-1 text-sm text-blue-600 font-medium hover:text-blue-700">
          + Add tier
        </button>
      </Section>

      <button type="submit"
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-sm">
        Save Pricing
      </button>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-center text-sm text-green-700 font-medium">
          {savedMessage ?? 'Pricing saved. New quotes will use these rates.'}
        </div>
      )}
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function InlineRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-700 flex-1 leading-tight">{label}</span>
      <div className="w-28 shrink-0">{children}</div>
    </div>
  );
}

function FeeRow({ label, enabled, amount, onToggle, onAmount }: {
  label: string;
  enabled: boolean;
  amount: number;
  onToggle: (v: boolean) => void;
  onAmount: (v: number) => void;
}) {
  return (
    <div className={`flex items-center gap-3 py-1 rounded-xl transition-opacity ${!enabled ? 'opacity-50' : ''}`}>
      <button type="button" onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
      <span className="text-sm text-gray-700 flex-1 leading-tight">{label} (RM)</span>
      <div className="w-24 shrink-0">
        <input type="number" value={amount} min="0" step="1" disabled={!enabled}
          onChange={e => onAmount(Number(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right disabled:bg-gray-50 disabled:cursor-not-allowed" />
      </div>
    </div>
  );
}
