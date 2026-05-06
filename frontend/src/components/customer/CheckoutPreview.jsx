import React from 'react';
import { formatIQD } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function Line({ label, value, strong = false }) {
  return (
    <div className="flex justify-between gap-3 items-center">
      <span className={`text-sm ${strong ? 'font-black text-slate-900' : 'text-slate-500 font-bold'}`}>
        {label}
      </span>
      <strong className={`text-right ${strong ? 'text-lg font-black text-slate-950' : 'text-slate-900'}`}>
        {value}
      </strong>
    </div>
  );
}

export default function CheckoutPreview({ offer, onConfirm, loading }) {
  const { t } = useLanguage();
  const deliveryFee = 6000;
  const total = Number(offer.customerPrice || 0) + deliveryFee;

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-4">
      <div className="rounded-[24px] bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4">
        <div className="text-[10px] uppercase font-black tracking-wide text-blue-100">
          {t('checkoutPreview')}
        </div>
        <div className="mt-2 text-xl font-black">
          {t('confirmOrder')}
        </div>
        <div className="mt-1 text-sm text-blue-100 font-semibold">
          {offer.request?.partName || offer.partName || t('part')}
        </div>
      </div>

      <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-4 space-y-3">
        <Line label={t('itemPrice')} value={formatIQD(offer.customerPrice)} />
        <Line label={t('deliveryFee')} value={formatIQD(deliveryFee)} />
        <div className="border-t border-slate-200 pt-3">
          <Line label={t('total')} value={formatIQD(total)} strong />
        </div>
      </div>

      <div className="rounded-[20px] bg-blue-50 border border-blue-100 text-blue-700 text-xs p-3 font-bold leading-relaxed">
        {t('paymentPlaceholder')}
      </div>

      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full py-3.5 rounded-2xl bg-[#27439C] text-white font-black shadow-sm disabled:opacity-40"
      >
        {loading ? t('confirming') : t('confirmOrder')}
      </button>
    </div>
  );
}
