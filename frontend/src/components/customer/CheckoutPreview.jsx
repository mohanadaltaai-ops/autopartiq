import React from 'react';
import { formatIQD } from '../../lib/api';

export default function CheckoutPreview({ offer, onConfirm, loading }) {
  const deliveryFee = 6000;
  const total = Number(offer.customerPrice || 0) + deliveryFee;

  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
      <div>
        <div className="text-xs text-slate-400 font-bold uppercase">Checkout preview</div>
        <div className="font-black text-slate-900">Confirm order</div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Item price</span><strong>{formatIQD(offer.customerPrice)}</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Delivery fee</span><strong>{formatIQD(deliveryFee)}</strong></div>
        <div className="border-t pt-2 flex justify-between"><span className="font-bold text-slate-900">Total</span><strong className="text-orange-600">{formatIQD(total)}</strong></div>
      </div>
      <div className="rounded-xl bg-amber-50 text-amber-700 text-xs p-3">
        Payment placeholder: cash on delivery is active for MVP. Card/wallet payment can be connected later.
      </div>
      <button onClick={onConfirm} disabled={loading} className="w-full py-3 rounded-2xl bg-orange-600 text-white font-black disabled:opacity-40">
        {loading ? 'Confirming...' : 'Confirm order'}
      </button>
    </div>
  );
}
