import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function OrderPaymentControls({ order, token, reload }) {
  const { t } = useLanguage();
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
    <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-2">
      <div className="text-xs font-black text-slate-700">{t('paymentControls')}</div>

      <div className="grid grid-cols-2 gap-2">
        <select className="p-2 rounded-xl border bg-white text-xs font-bold" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="CASH_ON_DELIVERY">{t('cashOnDelivery')}</option>
          <option value="CARD">{t('card')}</option>
          <option value="WALLET">{t('wallet')}</option>
          <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
        </select>

        <select className="p-2 rounded-xl border bg-white text-xs font-bold" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
          <option value="PENDING">{t('pending')}</option>
          <option value="PAID">{t('paid')}</option>
          <option value="FAILED">{t('failed')}</option>
          <option value="REFUNDED">{t('refunded')}</option>
        </select>
      </div>

      {error && <div className="text-xs text-red-600">{error}</div>}

      <button onClick={save} disabled={saving} className="w-full py-2 rounded-xl bg-[#27439C] text-white text-xs font-black disabled:opacity-40">
        {saving ? t('saving') : t('updatePayment')}
      </button>
    </div>
  );
}
