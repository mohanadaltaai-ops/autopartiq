import React, { useState } from 'react';
import SupplierEditForm from './SupplierEditForm';
import SupplierStatusBadge from './SupplierStatusBadge';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function safeParseMakes(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SupplierCard({ supplier, token, reload }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const makes = safeParseMakes(supplier.supportedMakesJson);
  const marketLabel = supplier.market === 'AE' ? t('uaeMarket') : t('iraqMarket');
  const ordersCount = supplier.orders?.length ?? 0;

  async function save(form) {
    setError('');
    await api(`/admin/suppliers/${supplier.id}`, { method: 'PATCH', token, body: form });
    setEditing(false);
    setOpen(false);
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
    return (
      <div className="bg-white rounded-[30px] border border-slate-200 p-4 shadow-sm space-y-4">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setOpen(false);
          }}
          className="w-full flex items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-black text-blue-600">{t('editSupplier')}</div>
            <div className="font-black text-slate-950 text-lg leading-tight break-words mt-1">{supplier.name}</div>
          </div>
          <SupplierStatusBadge isActive={supplier.isActive} />
        </button>

        <SupplierEditForm supplier={supplier} onSave={save} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[30px] border border-slate-200 p-4 shadow-sm space-y-3">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[10px] uppercase font-black text-blue-600">{t('supplier')}</div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-black">
                {marketLabel}
              </span>
            </div>

            <div className="font-black text-slate-950 text-lg leading-tight break-words mt-1">
              {supplier.name || t('notAvailable')}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-2">
                <div className="text-[9px] uppercase font-black text-slate-400">{t('phone')}</div>
                <div className="text-[11px] font-black text-slate-700 truncate dir-ltr text-left">{supplier.phone || '-'}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-2">
                <div className="text-[9px] uppercase font-black text-slate-400">{t('orders')}</div>
                <div className="text-[11px] font-black text-slate-700">{ordersCount}</div>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <SupplierStatusBadge isActive={supplier.isActive} />
            <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center text-lg font-black transition ${
              open ? 'bg-[#27439C] text-white border-[#27439C]' : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              {open ? '−' : '+'}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="pt-2 space-y-3 border-t border-slate-100">
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="rounded-[20px] bg-slate-50 border border-slate-100 p-3">
              <div className="text-[10px] text-blue-600 font-black uppercase">{t('location')}</div>
              <div className="font-bold text-slate-800 mt-1">{supplier.location || '-'}</div>
            </div>

            <div className="rounded-[20px] bg-slate-50 border border-slate-100 p-3">
              <div className="text-[10px] text-blue-600 font-black uppercase">{t('supportedMakes')}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {makes.length ? makes.map(make => (
                  <span key={make} className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600 font-black">
                    {make}
                  </span>
                )) : (
                  <span className="text-[11px] text-slate-400 font-bold">{t('notAvailable')}</span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                setEditing(true);
              }}
              className="py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-black"
            >
              {t('edit')}
            </button>

            <button
              type="button"
              onClick={disable}
              disabled={saving || supplier.isActive === false}
              className="py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-black disabled:opacity-40"
            >
              {saving ? t('saving') : t('disable')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
