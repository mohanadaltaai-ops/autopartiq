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
    <div className="space-y-2 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
      <div className="text-xs font-black text-slate-700 dark:text-slate-200">{t('paymentControls')}</div>

      <div className="grid grid-cols-2 gap-2">
        <select className="rounded-xl border border-blue-100 bg-white p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="CASH_ON_DELIVERY">{t('cashOnDelivery')}</option>
          <option value="CARD">{t('card')}</option>
          <option value="WALLET">{t('wallet')}</option>
          <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
        </select>

        <select className="rounded-xl border border-blue-100 bg-white p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
          <option value="PENDING">{t('pending')}</option>
          <option value="PAID">{t('paid')}</option>
          <option value="FAILED">{t('failed')}</option>
          <option value="REFUNDED">{t('refunded')}</option>
        </select>
      </div>

      {error && <div className="text-xs text-red-600">{error}</div>}

      <button onClick={save} disabled={saving} className="w-full rounded-xl bg-blue-600 py-2 text-xs font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-40">
        {saving ? t('saving') : t('updatePayment')}
      </button>
    </div>
  );
}
