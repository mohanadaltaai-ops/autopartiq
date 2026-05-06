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
    <div className="space-y-4 rounded-[1.5rem] border border-blue-100/80 bg-white/95 p-4 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/20">
      <div>
        <div className="font-black text-slate-950 dark:text-white">{t('editSupplier')}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">{t('editSupplierHint')}</div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-3 space-y-2">
        <div className="text-[10px] uppercase font-black text-slate-400">{t('supplierDetails')}</div>
        <input className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" placeholder={t('supplierName')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" placeholder={t('phone')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" placeholder={t('location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
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
            <label key={origin} className={`flex items-center gap-2 rounded-2xl border p-2 text-xs ${form.supportedMakes.includes(origin) ? 'border-blue-200 bg-blue-50 font-black text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`}>
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
        <button onClick={submit} disabled={saving || !form.name || !form.phone || !form.location} className="flex-1 rounded-xl bg-blue-600 py-3 font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-40">
          {saving ? t('saving') : t('save')}
        </button>
        <button onClick={onCancel} className="flex-1 rounded-xl bg-slate-100 py-3 font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
