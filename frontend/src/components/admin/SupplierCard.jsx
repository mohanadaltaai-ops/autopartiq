import React, { useState } from 'react';
import SupplierStatusBadge from './SupplierStatusBadge';
import SupplierEditForm from './SupplierEditForm';
import { api } from '../../lib/api';

export default function SupplierCard({ supplier, token, reload }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const makes = JSON.parse(supplier.supportedMakesJson || '[]');

  async function save(form) {
    setError('');
    await api(`/admin/suppliers/${supplier.id}`, { method: 'PATCH', token, body: form });
    setEditing(false);
    await reload();
  }

  async function disable() {
    setSaving(true);
    setError('');
    try {
      await api(`/admin/suppliers/${supplier.id}`, { method: 'DELETE', token });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return <SupplierEditForm supplier={supplier} onSave={save} onCancel={() => setEditing(false)} />;
  }

  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-slate-900">{supplier.name}</div>
          <div className="text-xs text-slate-500">{supplier.phone} • {supplier.location}</div>
          <div className="text-xs text-slate-400 mt-1">Makes: {makes.join(', ') || 'None'}</div>
        </div>
        <SupplierStatusBadge isActive={supplier.isActive} />
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="flex-1 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold">Edit</button>
        <button onClick={disable} disabled={saving || supplier.isActive === false} className="flex-1 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-bold disabled:opacity-40">Disable</button>
      </div>
    </div>
  );
}
