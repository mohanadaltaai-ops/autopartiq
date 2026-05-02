import React, { useState } from 'react';
import { api } from '../../lib/api';

export default function OrderPaymentControls({ order, token, reload }) {
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod || 'CASH_ON_DELIVERY');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'PENDING');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api(`/orders/${order.id}/payment`, { method: 'PATCH', token, body: { paymentMethod, paymentStatus } });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
      <div className="text-xs font-bold text-slate-500">Payment controls</div>
      <div className="grid grid-cols-2 gap-2">
        <select className="p-2 rounded-xl border text-xs" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="CASH_ON_DELIVERY">Cash on delivery</option>
          <option value="CARD">Card</option>
          <option value="WALLET">Wallet</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
        </select>
        <select className="p-2 rounded-xl border text-xs" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button onClick={save} disabled={saving} className="w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-bold disabled:opacity-40">
        {saving ? 'Saving...' : 'Update payment'}
      </button>
    </div>
  );
}
