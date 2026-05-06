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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-slate-400 font-bold">{label}</span>
      <strong className="text-slate-800 text-right">{value || '-'}</strong>
    </div>
  );
}

export default function OrderInfoPanel({ order }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 text-xs space-y-3">
      <div className="text-[10px] uppercase font-black text-blue-600">
        {t('orderDetails')}
      </div>

      <div className="space-y-1">
        <InfoRow label={t('payment')} value={paymentMethodLabel(order.paymentMethod || 'CASH_ON_DELIVERY', t)} />
        <InfoRow label={t('paymentStatus')} value={paymentStatusLabel(order.paymentStatus || 'PENDING', t)} />
        <InfoRow label={t('driver')} value={order.driverName || t('notAssigned')} />
        <InfoRow label={t('driverPhone')} value={order.driverPhone || t('pending')} />
        <InfoRow label={t('pickupEta')} value={order.pickupEta || t('pending')} />
        <InfoRow label={t('deliveryEta')} value={order.deliveryEta || t('pending')} />
      </div>

      {order.proofOfDeliveryUrl && (
        <a
          href={order.proofOfDeliveryUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-[18px] bg-white border border-slate-200 p-3 text-blue-700 font-black break-all"
        >
          {t('viewProofOfDelivery')}
        </a>
      )}

      {order.deliveryNotes && (
        <div className="rounded-[18px] bg-white border border-slate-200 p-3">
          <div className="font-black text-slate-800 mb-1">{t('deliveryComments')}</div>
          <div className="text-slate-500 font-semibold leading-relaxed">{order.deliveryNotes}</div>
        </div>
      )}
    </div>
  );
}
