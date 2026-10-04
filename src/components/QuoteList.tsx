import { useState } from 'react';
import type { SavedQuote, QuoteStatus } from '../types';

const STATUS_LEFT_BORDER: Record<QuoteStatus, string> = {
  draft:    'border-l-gray-300',
  sent:     'border-l-blue-400',
  accepted: 'border-l-green-400',
  rejected: 'border-l-red-300',
};

const STATUS_BADGE: Record<QuoteStatus, string> = {
  draft:    'bg-gray-100 text-gray-500',
  sent:     'bg-blue-100 text-blue-600',
  accepted: 'bg-green-100 text-green-600',
  rejected: 'bg-red-50 text-red-500',
};

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected',
};

const FILTER_TABS: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'draft',    label: 'Draft' },
  { value: 'sent',     label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

interface Props {
  quotes: SavedQuote[];
  onNew: () => void;
  onOpen: (id: string) => void;
}

export function QuoteList({ quotes, onNew, onOpen }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'all'>('all');

  const totalAccepted = quotes
    .filter(q => q.status === 'accepted')
    .reduce((s, q) => s + (q.result.breakdowns[0]?.total ?? 0), 0);
  const pending = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;

  const filtered = quotes.filter(q => {
    const matchSearch =
      q.input.customerName.toLowerCase().includes(search.toLowerCase()) ||
      q.result.quoteNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-3 pb-24">

      {/* Stats */}
      {quotes.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total" value={String(quotes.length)} sub="quotes" color="text-gray-800" />
          <StatCard label="Accepted" value={`RM ${totalAccepted >= 1000 ? (totalAccepted / 1000).toFixed(1) + 'k' : totalAccepted.toFixed(0)}`} sub="value" color="text-green-600" />
          <StatCard label="Pending" value={String(pending)} sub="open" color="text-blue-600" />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or quote no…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            ×
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {FILTER_TABS.map(tab => {
          const count = tab.value === 'all'
            ? quotes.length
            : quotes.filter(q => q.status === tab.value).length;
          return (
            <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                filterStatus === tab.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
              }`}>
              {tab.label} {count > 0 && <span className={`ml-0.5 ${filterStatus === tab.value ? 'opacity-75' : 'opacity-50'}`}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          {quotes.length === 0 ? (
            <>
              <div className="text-5xl mb-3">🏷️</div>
              <p className="font-semibold text-gray-700 mb-1">No quotes yet</p>
              <p className="text-sm text-gray-400 mb-5">Tap the button below to create your first quote</p>
              <button onClick={onNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                + New Quote
              </button>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500 text-sm">No quotes match your filter.</p>
              <button onClick={() => { setSearch(''); setFilterStatus('all'); }}
                className="mt-3 text-sm text-blue-600 font-medium hover:underline">
                Clear filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Quote cards */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(q => (
            <button key={q.id} onClick={() => onOpen(q.id)}
              className={`w-full bg-white rounded-2xl border border-gray-100 border-l-4 ${STATUS_LEFT_BORDER[q.status]} shadow-sm p-4 text-left hover:shadow-md active:scale-[0.99] transition-all`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate text-base">{q.input.customerName}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{q.result.quoteNo}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[q.status]}`}>
                    {STATUS_LABELS[q.status]}
                  </span>
                  {q.result.breakdowns.length > 1 ? (
                    <span className="text-xs font-bold text-gray-700">
                      RM {Math.min(...q.result.breakdowns.map(b => b.total)).toFixed(0)}–{Math.max(...q.result.breakdowns.map(b => b.total)).toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-base font-bold text-gray-800">RM {(q.result.breakdowns[0]?.total ?? 0).toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
                <Tag icon="📦">{(() => {
                  const { quantities, quantityUnit, packingPcsPerRoll } = q.input;
                  const byRolls = quantityUnit === 'rolls' && packingPcsPerRoll > 0;
                  if (byRolls) {
                    const rolls = quantities.map(p => p / packingPcsPerRoll).filter(r => Number.isInteger(r));
                    if (rolls.length === quantities.length) {
                      const min = Math.min(...rolls), max = Math.max(...rolls);
                      return quantities.length > 1 ? `${min}–${max} rolls` : `${min} roll${min !== 1 ? 's' : ''}`;
                    }
                  }
                  return quantities.length > 1
                    ? `${Math.min(...quantities).toLocaleString()}–${Math.max(...quantities).toLocaleString()} pcs`
                    : `${(quantities[0] ?? 0).toLocaleString()} pcs`;
                })()}</Tag>
                <Tag icon="📐">{q.input.labelWidth}×{q.input.labelHeight}mm</Tag>
                <Tag icon="🗓️">{q.result.date}</Tag>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={onNew}
        className="fixed bottom-6 right-6 flex items-center gap-2 pl-4 pr-5 py-3.5 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all z-10 text-sm"
        aria-label="New Quote">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        New Quote
      </button>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function Tag({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <span>{icon}</span>{children}
    </span>
  );
}
