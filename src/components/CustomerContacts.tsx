import { useState } from 'react';
import type { CustomerContact } from '../types';
import { loadContacts, saveContact, deleteContact, generateId } from '../store';

interface Props {
  onBack: () => void;
}

const EMPTY: Omit<CustomerContact, 'id'> = { name: '', email: '', phone: '' };

export function CustomerContacts({ onBack }: Props) {
  const [contacts, setContacts] = useState<CustomerContact[]>(loadContacts);
  const [editing, setEditing] = useState<CustomerContact | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  function refresh() {
    setContacts(loadContacts());
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(c: CustomerContact) {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone });
    setShowForm(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    saveContact({
      id: editing?.id ?? generateId(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    });
    refresh();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deleteContact(id);
    refresh();
    setDeleteId(null);
  }

  if (showForm) {
    return (
      <form onSubmit={handleSave} className="space-y-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {editing ? 'Edit Contact' : 'New Contact'}
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Customer / Company name" required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="customer@email.com" required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+60 12-345 6789" className={inputCls} />
          </div>
        </div>
        <button type="submit"
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-sm">
          {editing ? 'Update Contact' : 'Save Contact'}
        </button>
        <button type="button" onClick={() => setShowForm(false)}
          className="w-full py-3 border border-gray-200 text-gray-600 font-medium rounded-2xl text-sm hover:bg-gray-50">
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      <button onClick={openAdd}
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-sm flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Contact
      </button>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">No contacts yet.</p>
          <p className="text-gray-300 text-xs mt-1">Tap "Add Contact" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {contacts.map(c => (
            <div key={c.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-blue-600 truncate">{c.email}</p>
                {c.phone && <p className="text-xs text-gray-400 truncate">{c.phone}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(c)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {deleteId === c.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(c.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg">Delete</button>
                    <button onClick={() => setDeleteId(null)}
                      className="px-2 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(c.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onBack}
        className="w-full py-3 border border-gray-200 text-gray-600 font-medium rounded-2xl text-sm hover:bg-gray-50">
        Back to Settings
      </button>
    </div>
  );
}
