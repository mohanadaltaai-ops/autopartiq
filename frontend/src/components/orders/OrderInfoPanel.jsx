import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

function paymentMethodLabel(method, t) {
  const labels = {
    CASH_ON_DELIVERY: t('cashOnDelivery'),
    CARD: t('card'),
    WALLET: t('wallet'),
    BANK_TRANSFER: t('bankTransfer')
  };
  return labels[method] || method;
}

function paymentStatusLabel(status, t) {
  const labels = {
    PENDING: t('pending'),
    PAID: t('paid'),
    FAILED: t('failed'),
    REFUNDED: t('refunded')
  };
  return labels[status] || status;
}

export default function OrderInfoPanel({ order }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <span>{t('payment')}</span>
        <strong className="text-slate-700">{paymentMethodLabel(order.paymentMethod || 'CASH_ON_DELIVERY', t)}</strong>

        <span>{t('paymentStatus')}</span>
        <strong className="text-slate-700">{paymentStatusLabel(order.paymentStatus || 'PENDING', t)}</strong>

        <span>{t('driver')}</span>
        <strong className="text-slate-700">{order.driverName || t('notAssigned')}</strong>

        <span>{t('driverPhone')}</span>
        <strong className="text-slate-700">{order.driverPhone || t('pending')}</strong>

        <span>{t('pickupEta')}</span>
        <strong className="text-slate-700">{order.pickupEta || t('pending')}</strong>

        <span>{t('deliveryEta')}</span>
        <strong className="text-slate-700">{order.deliveryEta || t('pending')}</strong>
      </div>

      {order.proofOfDeliveryUrl && (
        <a
          href={order.proofOfDeliveryUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl bg-white border p-2 text-blue-700 font-bold break-all"
        >
          {t('viewProofOfDelivery')}
        </a>
      )}

      {order.deliveryNotes && (
        <div className="rounded-xl bg-white border p-2">
          <div className="font-bold text-slate-700 mb-1">{t('deliveryComments')}</div>
          <div>{order.deliveryNotes}</div>
        </div>
      )}
    </div>
  );
}
