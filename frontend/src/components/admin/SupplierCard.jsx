import React, { useState } from 'react';
import SupplierStatusBadge from './SupplierStatusBadge';
import SupplierEditForm from './SupplierEditForm';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SupplierCard({ supplier, token, reload }) {
  const { t } = useLanguage();
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
    <div className="space-y-3 rounded-[1.5rem] border border-blue-100/80 bg-white/95 p-4 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words font-black text-slate-950 dark:text-white">{supplier.name}</div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t('supplier')}</div>
        </div>
        <SupplierStatusBadge isActive={supplier.isActive} />
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{t('phone')}</div>
          <div className="font-bold text-slate-800 dir-ltr text-left">{supplier.phone}</div>
        </div>

        <div className="rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{t('location')}</div>
          <div className="font-bold text-slate-800">{supplier.location}</div>
        </div>

        <div className="space-y-2 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{t('makes')}</div>
          {makes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {makes.map(make => (
                <span key={make} className="px-2 py-1 rounded-full bg-white border text-[10px] font-bold text-slate-600">
                  {make}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">{t('none')}</div>
          )}
        </div>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 rounded-xl p-2">{error}</div>}

      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="flex-1 rounded-xl bg-blue-50 py-2 text-sm font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{t('edit')}</button>
        <button onClick={disable} disabled={saving || supplier.isActive === false} className="flex-1 rounded-xl bg-red-50 py-2 text-sm font-black text-red-700 disabled:opacity-40 dark:bg-red-500/10 dark:text-red-300">
          {saving ? t('saving') : t('disable')}
        </button>
      </div>
    </div>
  );
}
