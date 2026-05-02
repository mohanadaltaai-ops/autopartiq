import React, { useState } from 'react';
import { carData } from '../../data/carData';

export default function SupplierEditForm({ supplier, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: supplier.name,
    phone: supplier.phone,
    location: supplier.location,
    supportedMakes: JSON.parse(supplier.supportedMakesJson || '[]'),
    isActive: supplier.isActive !== false
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
      <input className="w-full p-3 rounded-xl border" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input className="w-full p-3 rounded-xl border" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      <input className="w-full p-3 rounded-xl border" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(carData).map(origin => (
          <label key={origin} className="text-xs bg-slate-50 rounded-xl p-2 flex gap-2 items-center">
            <input type="checkbox" checked={form.supportedMakes.includes(origin)} onChange={e => setForm(current => ({
              ...current,
              supportedMakes: e.target.checked ? [...current.supportedMakes, origin] : current.supportedMakes.filter(item => item !== origin)
            }))} />
            {origin}
          </label>
        ))}
      </div>
      <label className="text-sm flex gap-2 items-center">
        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
        Active supplier
      </label>
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving || !form.name || !form.phone} className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-40">Save</button>
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold">Cancel</button>
      </div>
    </div>
  );
}
