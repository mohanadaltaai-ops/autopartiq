import React from 'react';
import { formatIQD } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CheckoutPreview({ offer, onConfirm, loading }) {
  const { t } = useLanguage();
  const deliveryFee = 6000;
  const total = Number(offer.customerPrice || 0) + deliveryFee;

  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
      <div>
        <div className="text-xs text-slate-400 font-bold uppercase">{t('checkoutPreview')}</div>
        <div className="font-black text-slate-900">{t('confirmOrder')}</div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">{t('itemPrice')}</span>
          <strong>{formatIQD(offer.customerPrice)}</strong>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-slate-500">{t('deliveryFee')}</span>
          <strong>{formatIQD(deliveryFee)}</strong>
        </div>

        <div className="border-t pt-2 flex justify-between gap-3">
          <span className="font-bold text-slate-900">{t('total')}</span>
          <strong className="text-orange-600">{formatIQD(total)}</strong>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 text-amber-700 text-xs p-3">
        {t('paymentPlaceholder')}
      </div>

      <button onClick={onConfirm} disabled={loading} className="w-full py-3 rounded-2xl bg-orange-600 text-white font-black disabled:opacity-40">
        {loading ? t('confirming') : t('confirmOrder')}
      </button>
    </div>
  );
}
