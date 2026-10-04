import { useState } from 'react';
import type { CompanyInfo } from '../types';
import { loadCompany, saveCompany } from '../store';
import { BUILD_LABEL } from '../version';

interface Props {
  onBack: () => void;
  onContacts: () => void;
  onMachineProfiles: () => void;
}

export function Settings({ onBack: _onBack, onContacts, onMachineProfiles }: Props) {
  const [form, setForm] = useState<CompanyInfo>(loadCompany);
  const [saved, setSaved] = useState(false);

  function set(key: keyof CompanyInfo, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveCompany(form);
    setSaved(true);
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <form onSubmit={handleSave} className="space-y-4 pb-8">

      {/* Nav buttons */}
      <div className="space-y-2">
        <NavButton icon="🖨️" label="Machine Pricing" onClick={onMachineProfiles} />
        <NavButton icon="👥" label="Customer Contacts" onClick={onContacts} />
      </div>

      <Section title="Company Details">
        <Field label="Company Name *">
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Your Company Sdn. Bhd."
            required
            className={inputCls}
          />
        </Field>
        <Field label="Address">
          <textarea
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Full address"
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </Field>
        <Field label="Phone">
          <input
            type="text"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+60 12-345 6789"
            className={inputCls}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="info@yourcompany.com"
            className={inputCls}
          />
        </Field>
        <Field label="Website">
          <input
            type="text"
            value={form.website}
            onChange={e => set('website', e.target.value)}
            placeholder="www.yourcompany.com"
            className={inputCls}
          />
        </Field>
        <Field label="Default CC Email">
          <input
            type="email"
            value={form.defaultCcEmail}
            onChange={e => set('defaultCcEmail', e.target.value)}
            placeholder="Always CC this address when emailing quotes"
            className={inputCls}
          />
          <p className="text-xs text-gray-400 mt-1">Auto-CC'd on every quotation email sent.</p>
        </Field>
      </Section>

      <Section title="Tax & Banking (Optional)">
        <Field label="SST Registration No.">
          <input
            type="text"
            value={form.sstNo}
            onChange={e => set('sstNo', e.target.value)}
            placeholder="e.g. W10-1234-12345678"
            className={inputCls}
          />
        </Field>
        <Field label="Bank Name">
          <input
            type="text"
            value={form.bankName}
            onChange={e => set('bankName', e.target.value)}
            placeholder="e.g. Maybank"
            className={inputCls}
          />
        </Field>
        <Field label="Bank Account No.">
          <input
            type="text"
            value={form.bankAccount}
            onChange={e => set('bankAccount', e.target.value)}
            placeholder="e.g. 1234-5678-1234"
            className={inputCls}
          />
        </Field>
      </Section>

      <button
        type="submit"
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-sm"
      >
        Save Settings
      </button>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-center text-sm text-green-700 font-medium">
          Settings saved successfully.
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pb-2 font-mono">{BUILD_LABEL}</p>
    </form>
  );
}

function NavButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center justify-between text-sm font-medium text-gray-700 hover:border-blue-200 transition-colors"
    >
      <span className="flex items-center gap-2">
        <span className="text-base">{icon}</span> {label}
      </span>
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
