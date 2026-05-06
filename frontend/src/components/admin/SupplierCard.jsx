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
    <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-black text-slate-900 break-words">{supplier.name}</div>
          <div className="text-xs text-slate-400 mt-1">{t('supplier')}</div>
        </div>
        <SupplierStatusBadge isActive={supplier.isActive} />
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[10px] text-slate-400 font-bold uppercase">{t('phone')}</div>
          <div className="font-bold text-slate-800 dir-ltr text-left">{supplier.phone}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-[10px] text-slate-400 font-bold uppercase">{t('location')}</div>
          <div className="font-bold text-slate-800">{supplier.location}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 space-y-2">
          <div className="text-[10px] text-slate-400 font-bold uppercase">{t('makes')}</div>
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
        <button onClick={() => setEditing(true)} className="flex-1 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold">{t('edit')}</button>
        <button onClick={disable} disabled={saving || supplier.isActive === false} className="flex-1 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-bold disabled:opacity-40">
          {saving ? t('saving') : t('disable')}
        </button>
      </div>
    </div>
  );
}
