import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function OrderInfoPanel({ order }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <span>{t('payment')}</span>
        <strong className="text-slate-700">{order.paymentMethod || 'CASH_ON_DELIVERY'}</strong>

        <span>{t('paymentStatus')}</span>
        <strong className="text-slate-700">{order.paymentStatus || 'PENDING'}</strong>

        <span>{t('driver')}</span>
        <strong className="text-slate-700">{order.driverName || t('notAssigned')}</strong>

        <span>{t('driverPhone')}</span>
        <strong className="text-slate-700">{order.driverPhone || t('pending')}</strong>

        <span>{t('pickupEta')}</span>
        <strong className="text-slate-700">{order.pickupEta || t('pending')}</strong>

        <span>{t('deliveryEta')}</span>
        <strong className="text-slate-700">{order.deliveryEta || t('pending')}</strong>
      </div>

      {order.deliveryNotes && (
        <div className="rounded-xl bg-white border p-2">
          <div className="font-bold text-slate-700 mb-1">{t('deliveryComments')}</div>
          <div>{order.deliveryNotes}</div>
        </div>
      )}
    </div>
  );
}
