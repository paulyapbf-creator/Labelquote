import { useState, useCallback } from 'react';
import type { QuoteInput, QuoteStatus, SavedQuote } from './types';
import { calculateQuote } from './pricing';
import { loadQuotes, saveQuote, deleteQuote, updateQuoteStatus, generateId } from './store';
import { QuoteList } from './components/QuoteList';
import { QuoteForm } from './components/QuoteForm';
import { QuoteSummary } from './components/QuoteSummary';
import { Settings } from './components/Settings';
import { PricingSettings } from './components/PricingSettings';
import { BUILD_LABEL } from './version';

type View =
  | { page: 'list' }
  | { page: 'new' }
  | { page: 'edit'; id: string }
  | { page: 'view'; id: string }
  | { page: 'settings' }
  | { page: 'pricing' };

export default function App() {
  const [view, setView] = useState<View>({ page: 'list' });
  const [quotes, setQuotes] = useState<SavedQuote[]>(loadQuotes);

  const refresh = useCallback(() => setQuotes(loadQuotes()), []);

  function handleFormSubmit(input: QuoteInput, existingId?: string) {
    const result = calculateQuote(input);
    const now = new Date().toISOString();
    const id = existingId ?? generateId();

    const existing = existingId ? quotes.find(q => q.id === existingId) : undefined;

    const quote: SavedQuote = {
      id,
      status: existing?.status ?? 'draft',
      input,
      result,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    saveQuote(quote);
    refresh();
    setView({ page: 'view', id });
  }

  function handleDelete(id: string) {
    deleteQuote(id);
    refresh();
    setView({ page: 'list' });
  }

  function handleStatusChange(id: string, status: QuoteStatus) {
    updateQuoteStatus(id, status);
    refresh();
  }

  const currentQuote = (id: string) => quotes.find(q => q.id === id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          {view.page !== 'list' && (
            <button
              onClick={() => {
                if (view.page === 'view')     setView({ page: 'list' });
                else if (view.page === 'edit')    setView({ page: 'view', id: view.id });
                else if (view.page === 'pricing') setView({ page: 'settings' });
                else setView({ page: 'list' });
              }}
              className="p-1 -ml-1 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-base leading-tight">
              {view.page === 'list'     && 'LabelQuote'}
              {view.page === 'new'      && 'New Quote'}
              {view.page === 'edit'     && 'Edit Quote'}
              {view.page === 'view'     && 'Quote Details'}
              {view.page === 'settings' && 'Settings'}
              {view.page === 'pricing'  && 'Pricing Rates'}
            </p>
            {view.page === 'list' && (
              <p className="text-xs font-mono text-gray-400 leading-tight">{BUILD_LABEL}</p>
            )}
          </div>
          {view.page === 'list' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView({ page: 'settings' })}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => setView({ page: 'new' })}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                + New
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4">
        {view.page === 'list' && (
          <QuoteList
            quotes={quotes}
            onNew={() => setView({ page: 'new' })}
            onOpen={id => setView({ page: 'view', id })}
          />
        )}

        {view.page === 'new' && (
          <QuoteForm
            onSubmit={input => handleFormSubmit(input)}
          />
        )}

        {view.page === 'edit' && (() => {
          const q = currentQuote(view.id);
          if (!q) { setView({ page: 'list' }); return null; }
          return (
            <QuoteForm
              initial={q.input}
              onSubmit={input => handleFormSubmit(input, view.id)}
            />
          );
        })()}

        {view.page === 'settings' && (
          <Settings
            onBack={() => setView({ page: 'list' })}
            onPricingRates={() => setView({ page: 'pricing' })}
          />
        )}

        {view.page === 'pricing' && (
          <PricingSettings onBack={() => setView({ page: 'settings' })} />
        )}

        {view.page === 'view' && (() => {
          const q = currentQuote(view.id);
          if (!q) { setView({ page: 'list' }); return null; }
          return (
            <QuoteSummary
              savedQuote={q}
              onBack={() => setView({ page: 'list' })}
              onEdit={() => setView({ page: 'edit', id: view.id })}
              onStatusChange={status => handleStatusChange(view.id, status)}
              onDelete={() => handleDelete(view.id)}
            />
          );
        })()}
      </main>
    </div>
  );
}
