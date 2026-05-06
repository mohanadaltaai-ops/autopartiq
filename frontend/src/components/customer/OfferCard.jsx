import React, { useState } from 'react';
import { api, formatIQD } from '../../lib/api';
import CheckoutPreview from './CheckoutPreview';
import Toast from '../ui/Toast';
import ImagePreview from '../ui/ImagePreview';
import { useLanguage } from '../../contexts/LanguageContext';

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function OfferCard({ offer, token, reload }) {
  const { t } = useLanguage();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState(null);
  const offerPhotos = parseJsonArray(offer.photoUrlsJson);

  async function confirmOrder() {
    setConfirming(true);
    try {
      await api(`/offers/${offer.id}/accept`, { method: 'POST', token });
      setToast({ message: t('offerAccepted'), type: 'success' });
      await reload();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setConfirming(false);
    }
  }

  if (checkoutOpen) {
    return <>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <CheckoutPreview offer={offer} onConfirm={confirmOrder} loading={confirming} />
    </>;
  }

  return (
    <div className="rounded-[24px] bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black">
            {t('supplier')} {offer.supplier?.id?.slice(-1).toUpperCase()}
          </div>

          <div className="mt-3 text-2xl font-black text-slate-950 tracking-tight">
            {formatIQD(offer.customerPrice)}
          </div>

          <div className="mt-1 text-xs font-bold text-slate-500">
            {t('delivery')}: 6,000 IQD • {offer.condition === 'NEW' ? t('new') : t('used')}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="shrink-0 w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-black flex items-center justify-center"
        >
          {detailsOpen ? '−' : '+'}
        </button>
      </div>

      {detailsOpen && (
        <div className="space-y-3">
          <div className="rounded-[20px] bg-slate-50 border border-slate-100 p-3">
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-slate-400 font-bold">{t('price')}</span>
              <strong className="text-slate-900 text-right">{formatIQD(offer.customerPrice)}</strong>

              <span className="text-slate-400 font-bold">{t('condition')}</span>
              <strong className="text-slate-900 text-right">{offer.condition === 'NEW' ? t('new') : t('used')}</strong>

              <span className="text-slate-400 font-bold">{t('delivery')}</span>
              <strong className="text-slate-900 text-right">6,000 IQD</strong>
            </div>
          </div>

          {offer.notes && (
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-[18px] p-3 font-semibold leading-relaxed">
              {offer.notes}
            </div>
          )}

          {offerPhotos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {offerPhotos.map(url => (
                <ImagePreview key={url} src={url} alt="Offer" className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="w-full py-3 rounded-2xl bg-[#27439C] text-white text-sm font-black shadow-sm"
          >
            {t('checkout')}
          </button>
        </div>
      )}
    </div>
  );
}
