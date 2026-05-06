import React, { useState } from 'react';
import { carData } from '../../data/carData';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SupplierEditForm({ supplier, onSave, onCancel }) {
  const { t } = useLanguage();
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
    <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-4">
      <div>
        <div className="font-black text-slate-900">{t('editSupplier')}</div>
        <div className="text-xs text-slate-400">{t('editSupplierHint')}</div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-3 space-y-2">
        <div className="text-[10px] uppercase font-black text-slate-400">{t('supplierDetails')}</div>
        <input className="w-full p-3 rounded-xl border text-sm" placeholder={t('supplierName')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="w-full p-3 rounded-xl border text-sm" placeholder={t('phone')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full p-3 rounded-xl border text-sm" placeholder={t('location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
      </div>

      <div className="rounded-2xl bg-slate-50 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400">{t('supportedMakes')}</div>
            <div className="text-[10px] text-slate-400">{t('supportedMakesHint')}</div>
          </div>
          <div className="text-[10px] font-bold text-slate-500">
            {form.supportedMakes.length} / {Object.keys(carData).length}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.keys(carData).map(origin => (
            <label key={origin} className={`text-xs rounded-xl p-2 flex gap-2 items-center border ${form.supportedMakes.includes(origin) ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type="checkbox" checked={form.supportedMakes.includes(origin)} onChange={e => setForm(current => ({
                ...current,
                supportedMakes: e.target.checked ? [...current.supportedMakes, origin] : current.supportedMakes.filter(item => item !== origin)
              }))} />
              {origin}
            </label>
          ))}
        </div>
      </div>

      <label className={`rounded-2xl border p-3 flex gap-3 items-center ${form.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
        <div>
          <div className="text-sm font-black">{t('activeSupplier')}</div>
          <div className="text-[10px] opacity-80">{form.isActive ? t('supplierWillReceiveLeads') : t('supplierWillNotReceiveLeads')}</div>
        </div>
      </label>

      <div className="flex gap-2">
        <button onClick={submit} disabled={saving || !form.name || !form.phone || !form.location} className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-40">
          {saving ? t('saving') : t('save')}
        </button>
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold">
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
