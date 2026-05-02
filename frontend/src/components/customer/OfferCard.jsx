import React, { useState } from 'react';
import { api, formatIQD } from '../../lib/api';
import CheckoutPreview from './CheckoutPreview';

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function OfferCard({ offer, token, reload }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const offerPhotos = parseJsonArray(offer.photoUrlsJson);

  async function confirmOrder() {
    setConfirming(true);
    try {
      await api(`/offers/${offer.id}/accept`, { method: 'POST', token });
      await reload();
    } finally {
      setConfirming(false);
    }
  }

  if (checkoutOpen) {
    return <CheckoutPreview offer={offer} onConfirm={confirmOrder} loading={confirming} />;
  }

  return (
    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Supplier {offer.supplier?.id?.slice(-1).toUpperCase()}</div>
          <div className="font-bold">{formatIQD(offer.customerPrice)}</div>
          <div className="text-xs">Delivery: 6,000 IQD • {offer.condition}</div>
        </div>
        <button onClick={() => setCheckoutOpen(true)} className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-bold">Checkout</button>
      </div>
      {offerPhotos.length > 0 && <div className="flex gap-2 overflow-x-auto">{offerPhotos.map(url => <img key={url} src={url} alt="Offer" className="w-16 h-16 rounded-xl object-cover border" />)}</div>}
    </div>
  );
}
