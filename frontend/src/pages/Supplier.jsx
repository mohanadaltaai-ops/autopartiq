import React, { useEffect, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import DeliveryWorkflow from '../components/orders/DeliveryWorkflow';
import OrderInfoPanel from '../components/orders/OrderInfoPanel';

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isValidUrl(value) {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export default function Supplier({ tab }) {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [homeTab, setHomeTab] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [l, o, sent] = await Promise.all([api('/requests/supplier/leads', { token }), api('/orders/mine', { token }), api('/offers/mine', { token })]);
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

  if (loading) return <div className="p-4 text-slate-500">Loading supplier workspace...</div>;
  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;

  if (tab === 'orders') return <div className="p-4 space-y-3"><h1 className="font-black text-xl">Active Orders</h1>{orders.length === 0 && <Empty text="No accepted orders yet." />}{orders.map(o => <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm space-y-3"><div><div className="font-bold">{o.offer.request.partName}</div><div className="text-xs text-slate-500">{o.offer.request.make} {o.offer.request.model} • {o.offer.condition}</div><div className="text-xs text-slate-500 mt-1">Earnings: {formatIQD(o.supplierPrice)}</div><div className="text-[10px] mt-2 inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{o.status}</div></div><OrderInfoPanel order={o} /><DeliveryWorkflow status={o.status} /><div className="rounded-xl bg-slate-50 text-slate-500 text-xs p-3">Order status is managed by Admin. Supplier view is read-only.</div></div>)}</div>;
  if (tab === 'earnings') return <Earnings orders={orders} />;

  const offeredRequestIds = new Set(offers.filter(o => o.status !== 'CANCELLED').map(o => o.requestId));
  const visibleLeads = leads.filter(req => !offeredRequestIds.has(req.id));

  return <div className="p-4 space-y-3">
    <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 text-white p-5 shadow"><div className="text-sm opacity-80">Supplier workspace</div><div className="text-xl font-black">Offers & Leads</div></div>
    <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl border p-2">
      <button onClick={() => setHomeTab('leads')} className={`py-2 rounded-xl text-sm font-bold ${homeTab === 'leads' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Leads</button>
      <button onClick={() => setHomeTab('sent')} className={`py-2 rounded-xl text-sm font-bold ${homeTab === 'sent' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Sent Offers</button>
    </div>
    {homeTab === 'leads' ? <>{visibleLeads.length === 0 && <Empty text="No matching leads yet." />}{visibleLeads.map(req => <Lead key={req.id} req={req} token={token} reload={load} onSubmitted={() => setHomeTab('sent')} />)}</> : <SentOffers offers={offers} token={token} reload={load} />}
  </div>;
}

function Empty({ text }) {
  return <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">{text}</div>;
}

function Earnings({ orders }) {
  const eligible = orders.filter(o => o.status !== 'CANCELLED');
  const total = eligible.reduce((s, o) => s + o.supplierPrice, 0);
  const completed = eligible.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.supplierPrice, 0);
  const processing = eligible.filter(o => o.status !== 'COMPLETED').reduce((s, o) => s + o.supplierPrice, 0);

  return <div className="p-4 space-y-4">
    <div className="bg-blue-600 text-white rounded-3xl p-5 shadow">
      <div className="text-sm opacity-80">Total earnings</div>
      <div className="text-2xl font-black">{formatIQD(total)}</div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-2xl border p-4"><div className="text-[10px] text-slate-400 font-bold uppercase">Completed</div><div className="font-black text-green-700">{formatIQD(completed)}</div></div>
      <div className="bg-white rounded-2xl border p-4"><div className="text-[10px] text-slate-400 font-bold uppercase">Processing</div><div className="font-black text-blue-700">{formatIQD(processing)}</div></div>
    </div>
    <h2 className="font-black text-slate-900">Recent Transactions</h2>
    {eligible.length === 0 && <Empty text="No earnings transactions yet." />}
    {eligible.map(o => <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm flex justify-between gap-3">
      <div>
        <div className="font-bold text-slate-900">{o.offer.request.partName}</div>
        <div className="text-xs text-slate-500">{o.orderNumber} • {o.status}</div>
      </div>
      <div className="font-black text-blue-600">{formatIQD(o.supplierPrice)}</div>
    </div>)}
  </div>;
}

function SentOffers({ offers, token, reload }) {
  const [cancelReasonById, setCancelReasonById] = useState({});
  const [openCancelId, setOpenCancelId] = useState('');
  const [error, setError] = useState('');

  async function cancelOffer(offerId) {
    try {
      setError('');
      await api(`/offers/${offerId}/cancel`, { method: 'PATCH', token, body: { reason: cancelReasonById[offerId] || '' } });
      setOpenCancelId('');
      await reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!offers.length) return <Empty text="No sent offers yet." />;

  return <div className="space-y-3">
    {error && <div className="text-xs text-red-600 bg-red-50 rounded-xl p-2">{error}</div>}
    {offers.map(offer => {
      const photos = parseJsonArray(offer.photoUrlsJson);
      const canCancel = offer.status === 'ACTIVE';
      return <div key={offer.id} className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
        <div className="flex justify-between gap-3">
          <div><div className="font-bold text-slate-900">{offer.request?.partName}</div><div className="text-xs text-slate-500">{offer.request?.make} {offer.request?.model} • {offer.condition}</div></div>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full h-fit font-bold">{offer.status}</span>
        </div>
        <div className="text-sm font-black text-blue-600">{formatIQD(offer.customerPrice)}</div>
        {offer.cancellationReason && <div className="text-xs bg-red-50 text-red-700 rounded-xl p-2">Cancelled reason: {offer.cancellationReason}</div>}
        {photos.length > 0 && <div className="flex gap-2 overflow-x-auto">{photos.map(url => <img key={url} src={url} alt="Offer" className="w-16 h-16 rounded-xl object-cover border" />)}</div>}
        {canCancel && <div className="border-t pt-3 space-y-2">
          {openCancelId !== offer.id ? <button onClick={() => setOpenCancelId(offer.id)} className="text-xs font-bold text-red-600">Cancel sent offer</button> : <>
            <textarea className="w-full p-3 rounded-xl border text-sm" placeholder="Cancellation reason required" value={cancelReasonById[offer.id] || ''} onChange={e => setCancelReasonById(current => ({ ...current, [offer.id]: e.target.value }))} />
            <button onClick={() => cancelOffer(offer.id)} disabled={!cancelReasonById[offer.id]?.trim()} className="w-full py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40">Confirm cancellation</button>
          </>}
        </div>}
      </div>;
    })}
  </div>;
}

function Lead({ req, token, reload, onSubmitted }) {
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadNote, setUploadNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submitOffer() {
    try {
      setSending(true);
      setError('');
      if (!price || Number(price) <= 0) return setError('Valid supplier price is required');
      if (photoUrl.trim() && !isValidUrl(photoUrl)) return setError('Photo must be a valid URL, or leave it empty for now.');

      const photoUrls = photoUrl.trim() ? [photoUrl.trim()] : [];
      await api(`/offers/request/${req.id}`, { method:'POST', token, body: { supplierPrice: Number(price), condition, notes, photoUrls } });
      setPrice('');
      setNotes('');
      setPhotoUrl('');
      await reload();
      onSubmitted?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function checkUploadPlaceholder() {
    try {
      const result = await api('/uploads/placeholder', { method: 'POST', token, body: { fileName: 'offer-photo.jpg', fileType: 'image/jpeg', context: 'offer' } });
      setUploadNote(result.message);
    } catch (e) {
      setUploadNote(e.message);
    }
  }

  return <div className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm">
    <div><div className="font-bold">{req.partName}</div><div className="text-xs text-slate-500">{req.make} {req.model} ({req.year})</div><p className="text-xs text-slate-500 mt-1">{req.description}</p></div>
    <input className="w-full p-3 rounded-xl border" placeholder="Net price IQD" value={price} onChange={e => setPrice(e.target.value)} inputMode="numeric" />
    <select className="w-full p-3 rounded-xl border" value={condition} onChange={e => setCondition(e.target.value)}><option value="NEW">New</option><option value="USED">Used</option></select>
    <input className="w-full p-3 rounded-xl border" placeholder="Photo URL optional for MVP" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
    <button onClick={checkUploadPlaceholder} type="button" className="w-full py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold">Check upload placeholder</button>
    {uploadNote && <div className="text-xs text-slate-500">{uploadNote}</div>}
    {photoUrl && isValidUrl(photoUrl) && <img src={photoUrl} alt="Offer preview" className="w-full h-28 object-cover rounded-xl border" onError={event => { event.currentTarget.style.display = 'none'; }} />}
    <input className="w-full p-3 rounded-xl border" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
    {error && <div className="text-xs text-red-600">{error}</div>}
    <button onClick={submitOffer} disabled={!price || sending} className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black disabled:opacity-40">{sending ? 'Submitting...' : 'Submit Offer'}</button>
  </div>;
}
