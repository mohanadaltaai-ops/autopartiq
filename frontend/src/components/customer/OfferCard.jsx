import React, { useState } from 'react';
import { api, formatIQD } from '../../lib/api';
import CheckoutPreview from './CheckoutPreview';
import Toast from '../ui/Toast';
import ImagePreview from '../ui/ImagePreview';

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState(null);
  const offerPhotos = parseJsonArray(offer.photoUrlsJson);

  async function confirmOrder() {
    setConfirming(true);
    try {
      await api(`/offers/${offer.id}/accept`, { method: 'POST', token });
      setToast({ message: 'Offer accepted successfully. Your order has been created.', type: 'success' });
      await reload();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setConfirming(false);
    }
  }

  if (checkoutOpen) {
    return <><Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} /><CheckoutPreview offer={offer} onConfirm={confirmOrder} loading={confirming} /></>;
  }

  return (
    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Supplier {offer.supplier?.id?.slice(-1).toUpperCase()}</div>
          <div className="font-bold">{formatIQD(offer.customerPrice)}</div>
          <div className="text-xs">Delivery: 6,000 IQD • {offer.condition}</div>
        </div>
        <button onClick={() => setDetailsOpen(!detailsOpen)} className="px-4 py-2 rounded-xl bg-white border text-slate-700 text-sm font-bold">{detailsOpen ? 'Hide' : 'View'}</button>
      </div>
      {detailsOpen && <div className="rounded-xl bg-white border p-3 space-y-2">
        <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
          <span>Price</span><strong className="text-slate-900">{formatIQD(offer.customerPrice)}</strong>
          <span>Condition</span><strong className="text-slate-900">{offer.condition}</strong>
          <span>Delivery</span><strong className="text-slate-900">6,000 IQD</strong>
        </div>
        {offer.notes && <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2">{offer.notes}</div>}
        {offerPhotos.length > 0 && <div className="flex gap-2 overflow-x-auto">{offerPhotos.map(url => <ImagePreview key={url} src={url} alt="Offer" className="w-20 h-20 rounded-xl object-cover border" />)}</div>}
        <button onClick={() => setCheckoutOpen(true)} className="w-full py-2 rounded-xl bg-orange-600 text-white text-sm font-bold">Checkout</button>
      </div>}
    </div>
  );
}
