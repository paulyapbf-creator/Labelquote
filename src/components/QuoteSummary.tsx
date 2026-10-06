import { useState } from 'react';
import type { QuoteStatus, SavedQuote, CustomerContact } from '../types';
import { getMaterialName, getFinishingName, getShapeName } from '../pricing';
import { generatePDF } from '../utils/pdf';
import { generateTextQuote, openEmailQuote } from '../utils/textQuote';
import { loadContacts, loadCompany } from '../store';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; active: string; inactive: string }> = {
  draft:    { label: 'Draft',    active: 'bg-gray-600 text-white',   inactive: 'border border-gray-200 text-gray-500' },
  sent:     { label: 'Sent',     active: 'bg-blue-600 text-white',   inactive: 'border border-gray-200 text-gray-500' },
  accepted: { label: 'Accepted', active: 'bg-green-600 text-white',  inactive: 'border border-gray-200 text-gray-500' },
  rejected: { label: 'Rejected', active: 'bg-red-500 text-white',    inactive: 'border border-gray-200 text-gray-500' },
};

interface Props {
  savedQuote: SavedQuote;
  onBack: () => void;
  onEdit: () => void;
  onStatusChange: (status: QuoteStatus) => void;
  onDelete: () => void;
}

export function QuoteSummary({ savedQuote, onBack, onEdit, onStatusChange, onDelete }: Props) {
  const { input, result, status } = savedQuote;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');

  function handleCopyText() {
    const text = generateTextQuote(input, result);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSendEmail(toEmail: string) {
    const company = loadCompany();
    openEmailQuote(input, result, toEmail, company.defaultCcEmail);
    setShowEmailPicker(false);
    setEmailSearch('');
  }

  return (
    <div className="space-y-3 pb-8">

      {/* Total hero card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-xs font-mono">{result.quoteNo}</p>
            <h2 className="text-xl font-bold mt-1">{input.customerName}</h2>
            {input.customerContact && <p className="text-blue-200 text-sm mt-0.5">{input.customerContact}</p>}
            {input.customerEmail && <p className="text-blue-200 text-sm mt-0.5">{input.customerEmail}</p>}
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-blue-200 text-xs">From</p>
            <p className="text-3xl font-bold">RM {Math.min(...result.breakdowns.map(b => b.total)).toFixed(2)}</p>
            {result.breakdowns.length > 1 && (
              <p className="text-blue-200 text-xs mt-0.5">{result.breakdowns.length} qty tiers</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-4 text-xs text-blue-200">
          <span>Issued: <span className="text-white font-medium">{result.date}</span></span>
          <span>·</span>
          <span>Valid until: <span className="text-white font-medium">{result.validUntil}</span></span>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Status</p>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).map(s => (
            <button key={s} onClick={() => onStatusChange(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                s === status ? STATUS_CONFIG[s].active : STATUS_CONFIG[s].inactive
              }`}>
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Specs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Label Specifications</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <SpecItem label="Size"       value={`${input.labelWidth} × ${input.labelHeight} mm`} />
          <SpecItem label="Shape"      value={getShapeName(input.shape)} />
          <SpecItem label="Material"   value={getMaterialName(input.material)} />
          <SpecItem label="Color"      value={input.fullColor ? 'Full Color (CMYK)' : 'Single Color'} />
          <SpecItem label="Finishing"  value={getFinishingName(input.finishing)} />
          <SpecItem label="Quantities" value={
            input.quantityUnit === 'rolls' && input.packingPcsPerRoll > 0
              ? input.quantities.map(q => {
                  const r = q / input.packingPcsPerRoll;
                  return Number.isInteger(r) ? `${r} roll${r !== 1 ? 's' : ''} (${q.toLocaleString()} pcs)` : `${q.toLocaleString()} pcs`;
                }).join(', ')
              : input.quantities.map(q => q.toLocaleString()).join(', ') + ' pcs'
          } />
          {result.machineName && <SpecItem label="Machine"   value={result.machineName} />}
          <SpecItem label="Printer"    value={input.printerModel || '—'} />
          <SpecItem label="Core"       value={input.labelCore || '—'} />
          <SpecItem label="Packing"    value={input.packingPcsPerRoll ? `${input.packingPcsPerRoll.toLocaleString()} pcs/roll` : '—'} />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pricing Breakdown</p>
        {result.setupFee > 0 && (
          <PricingLine label="Setup / Plate Fee" amount={`RM ${result.setupFee.toFixed(2)}`} />
        )}
        {result.dieFee > 0 && (
          <PricingLine label="Custom Die-Cut Fee" amount={`RM ${result.dieFee.toFixed(2)}`} />
        )}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                <th className="text-left px-3 py-2 rounded-l-lg">Quantity</th>
                <th className="text-right px-3 py-2">Unit Price</th>
                <th className="text-right px-3 py-2">Subtotal</th>
                <th className="text-right px-3 py-2 rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdowns.map(bd => {
                const isRolls = input.quantityUnit === 'rolls' && input.packingPcsPerRoll > 0 && Number.isInteger(bd.quantity / input.packingPcsPerRoll);
                const rolls = isRolls ? bd.quantity / input.packingPcsPerRoll : 0;
                const unitPriceStr = isRolls
                  ? `RM ${(bd.unitPrice * input.packingPcsPerRoll).toFixed(2)}`
                  : `RM ${bd.unitPrice.toFixed(4)}`;
                return (
                  <tr key={bd.quantity} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2.5 font-semibold text-gray-800">
                      {isRolls
                        ? <>{rolls} roll{rolls !== 1 ? 's' : ''} <span className="text-xs text-gray-400 font-normal">({bd.quantity.toLocaleString()} pcs)</span></>
                        : <>{bd.quantity.toLocaleString()} pcs</>
                      }
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-500 font-mono text-xs">
                      {unitPriceStr}
                      <span className="text-gray-400 font-normal ml-0.5">{isRolls ? '/roll' : '/pcs'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">RM {bd.subtotal.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-blue-600">RM {bd.total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {input.notes.trim() && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{input.notes}</p>
        </div>
      )}

      {/* Actions */}
      <button onClick={() => generatePDF(input, result)}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-sm flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download PDF
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleCopyText}
          className="py-3 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? 'Copied!' : 'Copy Text'}
        </button>
        <button onClick={() => setShowEmailPicker(true)}
          className="py-3 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onEdit}
          className="py-3 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-sm">
          Edit Quote
        </button>
        <button onClick={onBack}
          className="py-3 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-sm">
          All Quotes
        </button>
      </div>

      {/* Email Contact Picker */}
      {showEmailPicker && (
        <EmailPicker
          quoteEmail={input.customerEmail}
          onSend={handleSendEmail}
          onClose={() => { setShowEmailPicker(false); setEmailSearch(''); }}
          search={emailSearch}
          onSearch={setEmailSearch}
        />
      )}

      {/* Delete */}
      {!showDeleteConfirm ? (
        <button onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-2.5 text-red-400 text-sm font-medium hover:text-red-600 transition-colors">
          Delete this quote
        </button>
      ) : (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-red-700 text-center">Delete permanently?</p>
          <p className="text-xs text-red-500 text-center">This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2.5 border border-gray-200 bg-white rounded-xl text-sm text-gray-600 font-medium">
              Cancel
            </button>
            <button onClick={onDelete}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function EmailPicker({ quoteEmail, onSend, onClose, search, onSearch }: {
  quoteEmail: string;
  onSend: (email: string) => void;
  onClose: () => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  const contacts = loadContacts();
  const q = search.toLowerCase();
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-4 pb-8 space-y-3 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-base">Send Quotation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          placeholder="Search contacts or type email…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          autoFocus
        />

        <div className="overflow-y-auto flex-1 space-y-1 min-h-0">
          {/* Quote's own email */}
          {quoteEmail && (
            <ContactRow
              name="This Quote"
              email={quoteEmail}
              badge="quote"
              onSend={() => onSend(quoteEmail)}
            />
          )}

          {/* Saved contacts */}
          {filtered.map((c: CustomerContact) => (
            <ContactRow key={c.id} name={c.name} email={c.email} onSend={() => onSend(c.email)} />
          ))}

          {filtered.length === 0 && !quoteEmail && contacts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No contacts saved yet.<br/>Go to Settings → Customer Contacts to add some.</p>
          )}
        </div>

        {/* Send to typed email if it looks valid */}
        {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(search) && (
          <button onClick={() => onSend(search)}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send to {search}
          </button>
        )}
      </div>
    </div>
  );
}

function ContactRow({ name, email, badge, onSend }: {
  name: string; email: string; badge?: string; onSend: () => void;
}) {
  return (
    <button onClick={onSend}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <span className="text-blue-600 font-bold text-sm">{name[0]?.toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{name}
          {badge && <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-normal">{badge}</span>}
        </p>
        <p className="text-xs text-gray-400 truncate">{email}</p>
      </div>
      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function PricingLine({ label, sub, amount }: { label: string; sub?: string; amount: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <span className="text-sm font-semibold text-gray-800 shrink-0 ml-3">{amount}</span>
    </div>
  );
}
