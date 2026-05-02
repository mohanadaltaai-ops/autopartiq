import React, { useState } from 'react';
import { api } from '../../lib/api';

export default function OrderDeliveryControls({ order, token, reload }) {
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
      await api(`/orders/${order.id}/delivery`, { method: 'PATCH', token, body: form });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
      <div className="text-xs font-bold text-slate-500">Delivery assignment</div>
      <input className="w-full p-2 rounded-xl border text-xs" placeholder="Driver name" value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
      <input className="w-full p-2 rounded-xl border text-xs" placeholder="Driver phone" value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className="p-2 rounded-xl border text-xs" placeholder="Pickup ETA" value={form.pickupEta} onChange={e => setForm({ ...form, pickupEta: e.target.value })} />
        <input className="p-2 rounded-xl border text-xs" placeholder="Delivery ETA" value={form.deliveryEta} onChange={e => setForm({ ...form, deliveryEta: e.target.value })} />
      </div>
      <input className="w-full p-2 rounded-xl border text-xs" placeholder="Proof of delivery URL" value={form.proofOfDeliveryUrl} onChange={e => setForm({ ...form, proofOfDeliveryUrl: e.target.value })} />
      <textarea className="w-full p-2 rounded-xl border text-xs" placeholder="Delivery notes" value={form.deliveryNotes} onChange={e => setForm({ ...form, deliveryNotes: e.target.value })} />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button onClick={save} disabled={saving} className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-40">
        {saving ? 'Saving...' : 'Update delivery'}
      </button>
    </div>
  );
}
