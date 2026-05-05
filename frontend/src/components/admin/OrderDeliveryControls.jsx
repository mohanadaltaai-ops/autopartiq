import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function cleanPayload(form) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, typeof value === 'string' && !value.trim() ? null : value])
  );
}

export default function OrderDeliveryControls({ order, token, reload }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    driverName: order.driverName || '',
    driverPhone: order.driverPhone || '',
    pickupEta: order.pickupEta || '',
    deliveryEta: order.deliveryEta || '',
    proofOfDeliveryUrl: order.proofOfDeliveryUrl || '',
    deliveryNotes: order.deliveryNotes || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api(`/orders/${order.id}/delivery`, { method: 'PATCH', token, body: cleanPayload(form) });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
      <div className="text-xs font-bold text-slate-500">{t('deliveryAssignment')}</div>

      <input className="w-full p-2 rounded-xl border text-xs" placeholder={t('driverName')} value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
      <input className="w-full p-2 rounded-xl border text-xs" placeholder={t('driverPhone')} value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} />

      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] font-bold text-slate-500 space-y-1">
          {t('pickupEta')}
          <input type="date" className="w-full p-2 rounded-xl border text-xs font-normal" value={form.pickupEta} onChange={e => setForm({ ...form, pickupEta: e.target.value })} />
        </label>

        <label className="text-[10px] font-bold text-slate-500 space-y-1">
          {t('deliveryEta')}
          <input type="date" className="w-full p-2 rounded-xl border text-xs font-normal" value={form.deliveryEta} onChange={e => setForm({ ...form, deliveryEta: e.target.value })} />
        </label>
      </div>

      <input className="w-full p-2 rounded-xl border text-xs" placeholder={t('proofOfDeliveryUrl')} value={form.proofOfDeliveryUrl} onChange={e => setForm({ ...form, proofOfDeliveryUrl: e.target.value })} />
      <textarea className="w-full p-2 rounded-xl border text-xs" placeholder={t('deliveryNotes')} value={form.deliveryNotes} onChange={e => setForm({ ...form, deliveryNotes: e.target.value })} />

      {error && <div className="text-xs text-red-600">{error}</div>}

      <button onClick={save} disabled={saving} className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-40">
        {saving ? t('saving') : t('updateDelivery')}
      </button>
    </div>
  );
}
