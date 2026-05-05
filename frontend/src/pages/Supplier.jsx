import React, { useEffect, useMemo, useState } from 'react';
import { api, formatIQD, uploadImage } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import DeliveryWorkflow from '../components/orders/DeliveryWorkflow';
import OrderInfoPanel from '../components/orders/OrderInfoPanel';
import Toast from '../components/ui/Toast';
import ImagePreview from '../components/ui/ImagePreview';

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Empty({ text }) {
  return <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">{text}</div>;
}

function SummaryRow({ label, value }) {
  return <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{label}</span><strong className="text-slate-700 text-right">{value || 'N/A'}</strong></div>;
}

function conditionLabel(condition, t) {
  if (condition === 'NEW') return t('new');
  if (condition === 'USED') return t('used');
  return condition;
}

function orderStatusLabel(status, t) {
  const labels = {
    WAITING_PICKUP: t('waitingPickup'),
    DELIVERING: t('delivering'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled')
  };
  return labels[status] || status;
}

function offerStatusLabel(status, t) {
  if (status === 'ACTIVE') return t('pending');
  if (status === 'REJECTED') return t('rejected') || 'Rejected';
  if (status === 'CANCELLED') return t('cancelled');
  if (status === 'ACCEPTED') return t('accepted') || 'Accepted';
  return status;
}

export default function Supplier({ tab }) {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [leads, setLeads] = useState([]);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [homeTab, setHomeTab] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  async function load() {
    try {
      setError('');
      const [l, o, sent] = await Promise.all([
        api('/requests/supplier/leads', { token }),
        api('/orders/mine', { token }),
        api('/offers/mine', { token })
      ]);
      setLeads(l.requests || []);
      setOrders(o.orders || []);
      setOffers(sent.offers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  const activeOfferCountByRequest = useMemo(() => offers.reduce((map, offer) => {
    if (!['CANCELLED', 'ACCEPTED'].includes(offer.status)) map[offer.requestId] = (map[offer.requestId] || 0) + 1;
    return map;
  }, {}), [offers]);

  if (loading) return <div className="p-4 text-slate-500">{t('loadingSupplier')}</div>;
  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;

  if (tab === 'orders') {
    return <div className="p-4 space-y-3">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <h1 className="font-black text-xl">{t('activeOrders')}</h1>
      {orders.length === 0 && <Empty text={t('noAcceptedOrders')} />}
      {orders.map(o => <OrderCard key={o.id} order={o} />)}
    </div>;
  }

  if (tab === 'earnings') return <Earnings orders={orders} />;

  return <div className="p-4 space-y-3">
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

    <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 text-white p-5 shadow">
      <div className="text-sm opacity-80">{t('supplierWorkspace')}</div>
      <div className="text-xl font-black">{t('offersLeads')}</div>
    </div>

    <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl border p-2">
      <button onClick={() => setHomeTab('leads')} className={`py-2 rounded-xl text-sm font-bold ${homeTab === 'leads' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
        {t('leads')}
      </button>
      <button onClick={() => setHomeTab('sent')} className={`py-2 rounded-xl text-sm font-bold ${homeTab === 'sent' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
        {t('sentOffers')}
      </button>
    </div>

    {homeTab === 'leads'
      ? <>
          {leads.length === 0 && <Empty text={t('noMatchingLeads')} />}
          {leads.map(req => (
            <Lead
              key={req.id}
              req={req}
              token={token}
              reload={load}
              onSubmitted={() => setHomeTab('sent')}
              existingCount={activeOfferCountByRequest[req.id] || 0}
              onToast={setToast}
            />
          ))}
        </>
      : <SentOffers offers={offers} token={token} reload={load} onToast={setToast} />}
  </div>;
}

function OrderCard({ order }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
    <button onClick={() => setOpen(value => !value)} className="w-full text-left flex items-start justify-between gap-3">
      <div>
        <div className="font-bold">{order.offer.request.partName}</div>
        <div className="text-xs text-slate-500">{order.offer.request.make} {order.offer.request.model} • {conditionLabel(order.offer.condition, t)}</div>
        <div className="text-xs text-slate-500 mt-1">{t('yourPrice')}: {formatIQD(order.supplierPrice)}</div>
      </div>
      <div className="text-right">
        <div className="text-[10px] inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold whitespace-nowrap inline-flex items-center shrink-0">{orderStatusLabel(order.status, t)}</div>
        <div className="text-[10px] text-slate-400 mt-2">{open ? t('hide') : t('details')}</div>
      </div>
    </button>

    {open && <>
      <OrderInfoPanel order={order} />
      <DeliveryWorkflow status={order.status} />
      <div className="rounded-xl bg-slate-50 text-slate-500 text-xs p-3">{t('orderReadOnly')}</div>
    </>}
  </div>;
}

function Earnings({ orders }) {
  const { t } = useLanguage();
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const pendingOrders = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status));
  const totalCompleted = completedOrders.reduce((sum, order) => sum + Number(order.supplierPrice || 0), 0);

  return <div className="p-4 space-y-4">
    <div className="bg-blue-600 text-white rounded-3xl p-5 shadow">
      <div className="text-sm opacity-80">{t('completedEarningsOnly')}</div>
      <div className="text-2xl font-black">{formatIQD(totalCompleted)}</div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-2xl border p-4">
        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('completedOrders')}</div>
        <div className="font-black text-green-700">{completedOrders.length}</div>
      </div>
      <div className="bg-white rounded-2xl border p-4">
        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('pendingOrders')}</div>
        <div className="font-black text-blue-700">{pendingOrders.length}</div>
      </div>
    </div>

    <h2 className="font-black text-slate-900">{t('completedTransactions')}</h2>
    {completedOrders.length === 0 && <Empty text={t('noCompletedEarnings')} />}
    {completedOrders.map(o => (
      <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm flex justify-between gap-3">
        <div>
          <div className="font-bold text-slate-900">{o.offer.request.partName}</div>
          <div className="text-xs text-slate-500">{o.orderNumber} • {t('completed')}</div>
        </div>
        <div className="font-black text-blue-600">{formatIQD(o.supplierPrice)}</div>
      </div>
    ))}
  </div>;
}

function SentOffers({ offers, token, reload, onToast }) {
  const { t } = useLanguage();
  const [cancelReasonById, setCancelReasonById] = useState({});
  const [openCancelId, setOpenCancelId] = useState('');
  const [openId, setOpenId] = useState('');
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const visibleOffers = offers
    .filter(offer => offer.status !== 'ACCEPTED')
    .filter(offer => statusFilter === 'ALL' || offer.status === statusFilter);

  async function cancelOffer(offerId) {
    try {
      setError('');
      await api(`/offers/${offerId}/cancel`, { method: 'PATCH', token, body: { reason: cancelReasonById[offerId] || '' } });
      setOpenCancelId('');
      onToast?.({ message: t('offerCancelled'), type: 'success' });
      await reload();
    } catch (e) {
      setError(e.message);
      onToast?.({ message: e.message, type: 'error' });
    }
  }

  return <div className="space-y-3">
    {error && <div className="text-xs text-red-600 bg-red-50 rounded-xl p-2">{error}</div>}

    <select className="w-full p-3 rounded-xl border text-sm bg-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
      <option value="ACTIVE">{t('pending')}</option>
      <option value="REJECTED">{t('rejected') || 'Rejected'}</option>
      <option value="CANCELLED">{t('cancelled')}</option>
      <option value="ALL">{t('allVisibleOffers') || 'All visible offers'}</option>
    </select>

    {visibleOffers.length === 0 && <Empty text={t('noMatchingSentOffers')} />}

    {visibleOffers.map(offer => {
      const photos = parseJsonArray(offer.photoUrlsJson);
      const canCancel = offer.status === 'ACTIVE';
      const open = openId === offer.id;

      return <div key={offer.id} className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
        <button onClick={() => setOpenId(open ? '' : offer.id)} className="w-full text-left flex justify-between gap-3">
          <div>
            <div className="font-bold text-slate-900">{offer.request?.partName}</div>
            <div className="text-xs text-slate-500">{offer.request?.make} {offer.request?.model} • {conditionLabel(offer.condition, t)}</div>
            <div className="text-sm font-black text-blue-600 mt-1">{formatIQD(offer.supplierPrice)}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full h-fit font-bold whitespace-nowrap inline-flex items-center shrink-0">{offerStatusLabel(offer.status, t)}</span>
            <div className="text-[10px] text-slate-400 mt-2">{open ? t('hide') : t('details')}</div>
          </div>
        </button>

        {open && <>
          <div className="rounded-xl bg-slate-50 p-3 space-y-1">
            <SummaryRow label={t('yourPrice')} value={formatIQD(offer.supplierPrice)} />
            <SummaryRow label={t('condition')} value={conditionLabel(offer.condition, t)} />
            <SummaryRow label={t('status')} value={offerStatusLabel(offer.status, t)} />
          </div>

          {offer.notes && <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2">{offer.notes}</div>}
          {offer.cancellationReason && <div className="text-xs bg-red-50 text-red-700 rounded-xl p-2">{t('reasonForCancellation')}: {offer.cancellationReason}</div>}

          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {photos.map(url => <ImagePreview key={url} src={url} alt="Offer" className="w-16 h-16 rounded-xl object-cover border" />)}
            </div>
          )}

          {canCancel && <div className="border-t pt-3 space-y-2">
            {openCancelId !== offer.id ? (
              <button onClick={() => setOpenCancelId(offer.id)} className="text-xs font-bold text-red-600">{t('cancelSentOffer')}</button>
            ) : <>
              <textarea
                className="w-full p-3 rounded-xl border text-sm"
                placeholder={t('reasonForCancellation')}
                value={cancelReasonById[offer.id] || ''}
                onChange={e => setCancelReasonById(current => ({ ...current, [offer.id]: e.target.value }))}
              />
              <button onClick={() => cancelOffer(offer.id)} disabled={!cancelReasonById[offer.id]?.trim()} className="w-full py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40">
                {t('confirmCancellation')}
              </button>
            </>}
          </div>}
        </>}
      </div>;
    })}
  </div>;
}

function Lead({ req, token, reload, onSubmitted, existingCount, onToast }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ supplierPrice: '', condition: 'NEW', notes: '', photoUrls: [] });
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const requestPhotos = parseJsonArray(req.photoUrlsJson);

  function resetDraft() {
    setDraft({ supplierPrice: '', condition: 'NEW', notes: '', photoUrls: [] });
    setEditIndex(null);
  }

  async function handleOfferPhotoUpload(file) {
    if (!file) return;
    if (draft.photoUrls.length >= 5) return setError(t('upload5'));
    setUploading(true);
    setError('');
    try {
      const result = await uploadImage(file, { token, context: 'offer' });
      setDraft(current => ({ ...current, photoUrls: [...current.photoUrls, result.url].slice(0, 5) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(index) {
    setDraft(current => ({ ...current, photoUrls: current.photoUrls.filter((_, photoIndex) => photoIndex !== index) }));
  }

  function addOrUpdateItem() {
    setError('');
    const supplierPrice = Number(draft.supplierPrice);
    if (!Number.isFinite(supplierPrice) || supplierPrice <= 0) return setError(t('validSupplierPrice'));

    const item = { supplierPrice, condition: draft.condition, notes: draft.notes.trim(), photoUrls: draft.photoUrls };
    setItems(current => editIndex === null ? [...current, item] : current.map((existing, index) => index === editIndex ? item : existing));
    resetDraft();
  }

  function editItem(index) {
    const item = items[index];
    setDraft({ supplierPrice: String(item.supplierPrice), condition: item.condition, notes: item.notes || '', photoUrls: item.photoUrls || [] });
    setEditIndex(index);
  }

  function removeItem(index) {
    setItems(current => current.filter((_, itemIndex) => itemIndex !== index));
    if (editIndex === index) resetDraft();
  }

  async function submitItems() {
    try {
      setSending(true);
      setError('');
      if (!items.length) return setError(t('addAtLeastOneItem'));
      for (const item of items) {
        await api(`/offers/request/${req.id}`, { method: 'POST', token, body: item });
      }
      setItems([]);
      resetDraft();
      onToast?.({ message: t('offerItemsSubmitted'), type: 'success' });
      await reload();
      onSubmitted?.();
    } catch (e) {
      setError(e.message);
      onToast?.({ message: e.message, type: 'error' });
    } finally {
      setSending(false);
    }
  }

  return <div className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm">
    <button onClick={() => setOpen(value => !value)} className="w-full text-left flex justify-between gap-3">
      <div>
        <div className="font-bold">{req.partName}</div>
        <div className="text-xs text-slate-500">{req.make} {req.model} ({req.year})</div>
        <div className="text-xs text-slate-400 mt-1">{existingCount ? `${existingCount} ${t('sentOffers')}` : t('noMatchingSentOffers')}</div>
      </div>
      <div className="text-[10px] text-blue-600 font-bold mt-1">{open ? t('hide') : t('open')}</div>
    </button>

    {open && <>
      <div className="rounded-xl bg-slate-50 p-3 space-y-1">
        <SummaryRow label={t('origin')} value={req.origin} />
        <SummaryRow label={t('make')} value={req.make} />
        <SummaryRow label={t('model')} value={req.model} />
        <SummaryRow label={t('year')} value={req.year} />
        <SummaryRow label={t('partName')} value={req.partName} />
        {req.partNumber && <SummaryRow label={t('partNumber')} value={req.partNumber} />}
        {req.vin && <SummaryRow label={t('vinChassis')} value={req.vin} />}
      </div>

      {req.description && <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">{req.description}</p>}

      {requestPhotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {requestPhotos.map(url => <ImagePreview key={url} src={url} alt="Request" className="w-16 h-16 rounded-xl object-cover border" />)}
        </div>
      )}

      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 space-y-2">
        <div className="text-xs font-black text-blue-700">{t('addOfferItem')}</div>

        <input className="w-full p-3 rounded-xl border" placeholder={t('netPriceIqd')} value={draft.supplierPrice} onChange={e => setDraft(current => ({ ...current, supplierPrice: e.target.value }))} inputMode="numeric" />

        <select className="w-full p-3 rounded-xl border" value={draft.condition} onChange={e => setDraft(current => ({ ...current, condition: e.target.value }))}>
          <option value="NEW">{t('new')}</option>
          <option value="USED">{t('used')}</option>
        </select>

        <div className="space-y-2">
          <label className="block w-full py-3 rounded-xl bg-blue-600 text-white text-center text-sm font-bold cursor-pointer">
            {uploading ? t('uploading') : t('uploadOfferPhoto')}
            <input type="file" accept="image/*" className="hidden" disabled={uploading || draft.photoUrls.length >= 5} onChange={e => handleOfferPhotoUpload(e.target.files?.[0])} />
          </label>
          <div className="text-[10px] text-slate-400">{t('imageHelp')}</div>

          {draft.photoUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {draft.photoUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative">
                  <ImagePreview src={url} alt="Offer preview" className="w-16 h-16 rounded-xl object-cover border" />
                  <button onClick={() => removePhoto(index)} type="button" className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold whitespace-nowrap inline-flex items-center shrink-0">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <input className="w-full p-3 rounded-xl border" placeholder={t('notes')} value={draft.notes} onChange={e => setDraft(current => ({ ...current, notes: e.target.value }))} />

        <div className="grid grid-cols-2 gap-2">
          <button onClick={addOrUpdateItem} className="py-2 rounded-xl bg-blue-600 text-white font-bold">{editIndex === null ? t('addItem') : t('updateItem')}</button>
          <button onClick={resetDraft} type="button" className="py-2 rounded-xl bg-white border text-slate-600 font-bold">{t('clear')}</button>
        </div>
      </div>

      {items.length > 0 && <div className="space-y-2">
        <div className="text-xs font-black text-slate-500">{t('itemsReady')}: {items.length}</div>
        {items.map((item, index) => (
          <div key={`${item.condition}-${item.supplierPrice}-${index}`} className="rounded-xl border bg-slate-50 p-3 space-y-2">
            <div className="flex justify-between gap-3">
              <div>
                <div className="font-bold text-sm">{conditionLabel(item.condition, t)} • {formatIQD(item.supplierPrice)}</div>
                {item.notes && <div className="text-xs text-slate-500">{item.notes}</div>}
                <div className="text-[10px] text-slate-400">{t('requestPhotosUpTo4')}: {item.photoUrls?.length || 0}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editItem(index)} className="text-xs font-bold text-blue-600">{t('edit')}</button>
                <button onClick={() => removeItem(index)} className="text-xs font-bold text-red-600">{t('remove')}</button>
              </div>
            </div>
          </div>
        ))}
      </div>}

      {error && <div className="text-xs text-red-600 bg-red-50 rounded-xl p-2">{error}</div>}

      <button onClick={submitItems} disabled={!items.length || sending} className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black disabled:opacity-40">
        {sending ? t('uploading') : `${t('submitOfferItems')} ${items.length || ''}`}
      </button>
    </>}
  </div>;
}
