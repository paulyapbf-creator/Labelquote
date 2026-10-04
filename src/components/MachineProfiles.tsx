import { useState } from 'react';
import type { PricingProfile } from '../types';
import { loadProfiles, saveProfile, deleteProfile, generateId, loadPricing } from '../store';

interface Props {
  onBack: () => void;
  onEditRates: (profileId: string) => void;
}

export function MachineProfiles({ onBack, onEditRates }: Props) {
  const [profiles, setProfiles] = useState<PricingProfile[]>(loadProfiles);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function refresh() { setProfiles(loadProfiles()); }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const profile: PricingProfile = {
      id: generateId(),
      name: newName.trim(),
      config: JSON.parse(JSON.stringify(loadPricing())), // clone global defaults
    };
    saveProfile(profile);
    refresh();
    setNewName('');
    setAdding(false);
  }

  function handleDelete(id: string) {
    deleteProfile(id);
    refresh();
    setDeleteId(null);
  }

  return (
    <div className="space-y-3 pb-8">

      {/* Add button / form */}
      {adding ? (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">New Machine Profile</h2>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Zebra ZT411, HP Indigo, Flexo Line 1"
            autoFocus
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <p className="text-xs text-gray-400">Pricing rates will be cloned from your current default rates. Customise them after saving.</p>
          <div className="flex gap-2">
            <button type="submit"
              className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 active:scale-95 transition-all">
              Add Machine
            </button>
            <button type="button" onClick={() => { setAdding(false); setNewName(''); }}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Machine Profile
        </button>
      )}

      {/* Default profile (global rates) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Default Rates</p>
            <p className="text-xs text-gray-400">Used when no machine is selected on a quote</p>
          </div>
          <button
            onClick={() => onEditRates('__default__')}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shrink-0">
            Edit Rates
          </button>
        </div>

        {/* Machine profiles */}
        {profiles.map(p => (
          <div key={p.id} className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => onEditRates(p.id)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                Edit Rates
              </button>
              {deleteId === p.id ? (
                <div className="flex gap-1">
                  <button onClick={() => handleDelete(p.id)}
                    className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg">Delete</button>
                  <button onClick={() => setDeleteId(null)}
                    className="px-2 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setDeleteId(p.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <p className="text-center text-xs text-gray-400 pt-1">No machine profiles yet. Add one above to set per-machine pricing.</p>
      )}

      <button onClick={onBack}
        className="w-full py-3 border border-gray-200 text-gray-600 font-medium rounded-2xl text-sm hover:bg-gray-50">
        Back to Settings
      </button>
    </div>
  );
}
