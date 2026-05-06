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
    <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black mb-2">
            {t('supplier')}
          </div>
          <div className="font-black text-slate-950 break-words text-lg leading-tight">{supplier.name}</div>
        </div>
        <SupplierStatusBadge isActive={supplier.isActive} />
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="rounded-[20px] bg-slate-50 border border-slate-100 p-3">
          <div className="text-[10px] text-blue-600 font-black uppercase">{t('phone')}</div>
          <div className="font-bold text-slate-800 dir-ltr text-left mt-1">{supplier.phone}</div>
        </div>

        <div className="rounded-[20px] bg-slate-50 border border-slate-100 p-3">
          <div className="text-[10px] text-blue-600 font-black uppercase">{t('location')}</div>
          <div className="font-bold text-slate-800 mt-1">{supplier.location}</div>
        </div>

        <div className="rounded-[20px] bg-slate-50 border border-slate-100 p-3 space-y-2">
          <div className="text-[10px] text-blue-600 font-black uppercase">{t('makes')}</div>
          {makes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {makes.map(make => (
                <span key={make} className="px-2 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-600">
                  {make}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-bold">{t('none')}</div>
          )}
        </div>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3 font-bold">{error}</div>}

      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="flex-1 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-black">{t('edit')}</button>
        <button onClick={disable} disabled={saving || supplier.isActive === false} className="flex-1 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-black disabled:opacity-40">
          {saving ? t('saving') : t('disable')}
        </button>
      </div>
    </div>
  );
}
