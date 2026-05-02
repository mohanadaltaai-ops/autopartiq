import React, { useEffect, useMemo, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import DeliveryWorkflow from '../components/orders/DeliveryWorkflow';
import OrderInfoPanel from '../components/orders/OrderInfoPanel';
import Toast from '../components/ui/Toast';

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

function Empty({ text }) {
  return <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">{text}</div>;
}

function SummaryRow({ label, value }) {
  return <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{label}</span><strong className="text-slate-700 text-right">{value || 'N/A'}</strong></div>;
}

export default function Supplier({ tab }) {
  const { token } = useAuth();
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

  const activeOfferCountByRequest = useMemo(() => offers.reduce((map, offer) => {
    if (offer.status !== 'CANCELLED') map[offer.requestId] = (map[offer.requestId] || 0) + 1;
    return map;
  }, {}), [offers]);

  if (loading) return <div className="p-4 text-slate-500">Loading supplier workspace...</div>;
  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;

  if (tab === 'orders') return <div className="p-4 space-y-3"><Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} /><h1 className="font-black text-xl">Active Orders</h1>{orders.length === 0 && <Empty text="No accepted orders yet." />}{orders.map(o => <OrderCard key={o.id} order={o} />)}</div>;
  if (tab === 'earnings') return <Earnings orders={orders} />;

  return <div className="p-4 space-y-3">
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 text-white p-5 shadow"><div className="text-sm opacity-80">Supplier workspace</div><div className="text-xl font-black">Offers & Leads</div></div>
    <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl border p-2">
      <button onClick={() => setHomeTab('leads')} className={`py-2 rounded-xl text-sm font-bold ${homeTab === 'leads' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Leads</button>
      <button onClick={() => setHomeTab('sent')} className={`py-2 rounded-xl text-sm font-bold ${homeTab === 'sent' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Sent Offers</button>
    </div>
    {homeTab === 'leads'
      ? <>{leads.length === 0 && <Empty text="No matching leads yet." />}{leads.map(req => <Lead key={req.id} req={req} token={token} reload={load} onSubmitted={() => setHomeTab('sent')} existingCount={activeOfferCountByRequest[req.id] || 0} onToast={setToast} />)}</>
      : <SentOffers offers={offers} token={token} reload={load} onToast={setToast} />}
  </div>;
}

function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  return <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
    <button onClick={() => setOpen(value => !value)} className="w-full text-left flex items-start justify-between gap-3">
      <div><div className="font-bold">{order.offer.request.partName}</div><div className="text-xs text-slate-500">{order.offer.request.make} {order.offer.request.model} • {order.offer.condition}</div><div className="text-xs text-slate-500 mt-1">Your price: {formatIQD(order.supplierPrice)}</div></div>
      <div className="text-right"><div className="text-[10px] inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{order.status}</div><div className="text-[10px] text-slate-400 mt-2">{open ? 'Hide' : 'Details'}</div></div>
    </button>
    {open && <><OrderInfoPanel order={order} /><DeliveryWorkflow status={order.status} /><div className="rounded-xl bg-slate-50 text-slate-500 text-xs p-3">Order status is managed by Admin. Supplier view is read-only.</div></>}
  </div>;
}

function Earnings({ orders }) {
  const eligible = orders.filter(o => o.status !== 'CANCELLED');
  const total = eligible.reduce((s, o) => s + o.supplierPrice, 0);
  const completed = eligible.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.supplierPrice, 0);
  const processing = eligible.filter(o => o.status !== 'COMPLETED').reduce((s, o) => s + o.supplierPrice, 0);

  return <div className="p-4 space-y-4">
    <div className="bg-blue-600 text-white rounded-3xl p-5 shadow"><div className="text-sm opacity-80">Total earnings</div><div className="text-2xl font-black">{formatIQD(total)}</div></div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-2xl border p-4"><div className="text-[10px] text-slate-400 font-bold uppercase">Completed</div><div className="font-black text-green-700">{formatIQD(completed)}</div></div>
      <div className="bg-white rounded-2xl border p-4"><div className="text-[10px] text-slate-400 font-bold uppercase">Processing</div><div className="font-black text-blue-700">{formatIQD(processing)}</div></div>
    </div>
    <h2 className="font-black text-slate-900">Recent Transactions</h2>
    {eligible.length === 0 && <Empty text="No earnings transactions yet." />}
    {eligible.map(o => <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm flex justify-between gap-3"><div><div className="font-bold text-slate-900">{o.offer.request.partName}</div><div className="text-xs text-slate-500">{o.orderNumber} • {o.status}</div></div><div className="font-black text-blue-600">{formatIQD(o.supplierPrice)}</div></div>)}
  </div>;
}

function SentOffers({ offers, token, reload, onToast }) {
  const [cancelReasonById, setCancelReasonById] = useState({});
  const [openCancelId, setOpenCancelId] = useState('');
  const [openId, setOpenId] = useState('');
  const [error, setError] = useState('');

  async function cancelOffer(offerId) {
    try {
      setError('');
      await api(`/offers/${offerId}/cancel`, { method: 'PATCH', token, body: { reason: cancelReasonById[offerId] || '' } });
      setOpenCancelId('');
      onToast?.({ message: 'Offer cancelled successfully.', type: 'success' });
      await reload();
    } catch (e) {
      setError(e.message);
      onToast?.({ message: e.message, type: 'error' });
    }
  }

  if (!offers.length) return <Empty text="No sent offers yet." />;

  return <div className="space-y-3">
    {error && <div className="text-xs text-red-600 bg-red-50 rounded-xl p-2">{error}</div>}
    {offers.map(offer => {
      const photos = parseJsonArray(offer.photoUrlsJson);
      const canCancel = offer.status === 'ACTIVE';
      const open = openId === offer.id;
      return <div key={offer.id} className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
        <button onClick={() => setOpenId(open ? '' : offer.id)} className="w-full text-left flex justify-between gap-3">
          <div><div className="font-bold text-slate-900">{offer.request?.partName}</div><div className="text-xs text-slate-500">{offer.request?.make} {offer.request?.model} • {offer.condition}</div><div className="text-sm font-black text-blue-600 mt-1">{formatIQD(offer.supplierPrice)}</div></div>
          <div className="text-right"><span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full h-fit font-bold">{offer.status}</span><div className="text-[10px] text-slate-400 mt-2">{open ? 'Hide' : 'Details'}</div></div>
        </button>
        {open && <>
          <div className="rounded-xl bg-slate-50 p-3 space-y-1"><SummaryRow label="Your price" value={formatIQD(offer.supplierPrice)} /><SummaryRow label="Condition" value={offer.condition} /></div>
          {offer.notes && <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2">{offer.notes}</div>}
          {offer.cancellationReason && <div className="text-xs bg-red-50 text-red-700 rounded-xl p-2">Cancelled reason: {offer.cancellationReason}</div>}
          {photos.length > 0 && <div className="flex gap-2 overflow-x-auto">{photos.map(url => <img key={url} src={url} alt="Offer" className="w-16 h-16 rounded-xl object-cover border" />)}</div>}
          {canCancel && <div className="border-t pt-3 space-y-2">
            {openCancelId !== offer.id ? <button onClick={() => setOpenCancelId(offer.id)} className="text-xs font-bold text-red-600">Cancel sent offer</button> : <>
              <textarea className="w-full p-3 rounded-xl border text-sm" placeholder="Cancellation reason required" value={cancelReasonById[offer.id] || ''} onChange={e => setCancelReasonById(current => ({ ...current, [offer.id]: e.target.value }))} />
              <button onClick={() => cancelOffer(offer.id)} disabled={!cancelReasonById[offer.id]?.trim()} className="w-full py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40">Confirm cancellation</button>
            </>}
          </div>}
        </>}
      </div>;
    })}
  </div>;
}

function Lead({ req, token, reload, onSubmitted, existingCount, onToast }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ supplierPrice: '', condition: 'NEW', notes: '', photoUrls: [] });
  const [photoInput, setPhotoInput] = useState('');
  const [items, setItems] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [uploadNote, setUploadNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const requestPhotos = parseJsonArray(req.photoUrlsJson);

  function resetDraft() {
    setDraft({ supplierPrice: '', condition: 'NEW', notes: '', photoUrls: [] });
    setPhotoInput('');
    setEditIndex(null);
  }

  function addPhoto() {
    setError('');
    if (!photoInput.trim()) return;
    if (!isValidUrl(photoInput)) return setError('Photo must be a valid URL.');
    setDraft(current => ({ ...current, photoUrls: [...current.photoUrls, photoInput.trim()].slice(0, 5) }));
    setPhotoInput('');
  }

  function removePhoto(index) {
    setDraft(current => ({ ...current, photoUrls: current.photoUrls.filter((_, photoIndex) => photoIndex !== index) }));
  }

  function addOrUpdateItem() {
    setError('');
    const supplierPrice = Number(draft.supplierPrice);
    if (!Number.isFinite(supplierPrice) || supplierPrice <= 0) return setError('Valid supplier price is required');

    const item = { supplierPrice, condition: draft.condition, notes: draft.notes.trim(), photoUrls: draft.photoUrls };
    setItems(current => editIndex === null ? [...current, item] : current.map((existing, index) => index === editIndex ? item : existing));
    resetDraft();
  }

  function editItem(index) {
    const item = items[index];
    setDraft({ supplierPrice: String(item.supplierPrice), condition: item.condition, notes: item.notes || '', photoUrls: item.photoUrls || [] });
    setPhotoInput('');
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
      if (!items.length) return setError('Add at least one item before submitting.');
      for (const item of items) {
        await api(`/offers/request/${req.id}`, { method: 'POST', token, body: item });
      }
      setItems([]);
      resetDraft();
      onToast?.({ message: 'Offer items submitted successfully.', type: 'success' });
      await reload();
      onSubmitted?.();
    } catch (e) {
      setError(e.message);
      onToast?.({ message: e.message, type: 'error' });
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
    <button onClick={() => setOpen(value => !value)} className="w-full text-left flex justify-between gap-3">
      <div><div className="font-bold">{req.partName}</div><div className="text-xs text-slate-500">{req.make} {req.model} ({req.year})</div><div className="text-xs text-slate-400 mt-1">{existingCount ? `${existingCount} sent offer item(s)` : 'No sent offers yet'}</div></div>
      <div className="text-[10px] text-blue-600 font-bold mt-1">{open ? 'Hide' : 'Open'}</div>
    </button>

    {open && <>
      <div className="rounded-xl bg-slate-50 p-3 space-y-1">
        <SummaryRow label="Origin" value={req.origin} />
        <SummaryRow label="Make" value={req.make} />
        <SummaryRow label="Model" value={req.model} />
        <SummaryRow label="Year" value={req.year} />
        <SummaryRow label="Part" value={req.partName} />
        {req.partNumber && <SummaryRow label="Part number" value={req.partNumber} />}
        {req.vin && <SummaryRow label="VIN / Chassis" value={req.vin} />}
      </div>
      {req.description && <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">{req.description}</p>}
      {requestPhotos.length > 0 && <div className="flex gap-2 overflow-x-auto">{requestPhotos.map(url => <img key={url} src={url} alt="Request" className="w-16 h-16 rounded-xl object-cover border" />)}</div>}
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 space-y-2">
        <div className="text-xs font-black text-blue-700">Add offer item</div>
        <input className="w-full p-3 rounded-xl border" placeholder="Net price IQD" value={draft.supplierPrice} onChange={e => setDraft(current => ({ ...current, supplierPrice: e.target.value }))} inputMode="numeric" />
        <select className="w-full p-3 rounded-xl border" value={draft.condition} onChange={e => setDraft(current => ({ ...current, condition: e.target.value }))}><option value="NEW">New</option><option value="USED">Used</option></select>
        <div className="space-y-2">
          <div className="flex gap-2"><input className="flex-1 p-3 rounded-xl border" placeholder="Photo URL optional" value={photoInput} onChange={e => setPhotoInput(e.target.value)} /><button onClick={addPhoto} type="button" disabled={draft.photoUrls.length >= 5} className="px-3 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-40">Add</button></div>
          {draft.photoUrls.length > 0 && <div className="flex gap-2 overflow-x-auto">{draft.photoUrls.map((url, index) => <div key={`${url}-${index}`} className="relative"><img src={url} alt="Offer preview" className="w-16 h-16 rounded-xl object-cover border" /><button onClick={() => removePhoto(index)} type="button" className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold">×</button></div>)}</div>}
        </div>
        <button onClick={checkUploadPlaceholder} type="button" className="w-full py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold">Check upload placeholder</button>
        {uploadNote && <div className="text-xs text-slate-500">{uploadNote}</div>}
        <input className="w-full p-3 rounded-xl border" placeholder="Notes" value={draft.notes} onChange={e => setDraft(current => ({ ...current, notes: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={addOrUpdateItem} className="py-2 rounded-xl bg-blue-600 text-white font-bold">{editIndex === null ? 'Add Item' : 'Update Item'}</button>
          <button onClick={resetDraft} type="button" className="py-2 rounded-xl bg-white border text-slate-600 font-bold">Clear</button>
        </div>
      </div>

      {items.length > 0 && <div className="space-y-2">
        <div className="text-xs font-black text-slate-500">Items ready to submit: {items.length}</div>
        {items.map((item, index) => <div key={`${item.condition}-${item.supplierPrice}-${index}`} className="rounded-xl border bg-slate-50 p-3 space-y-2">
          <div className="flex justify-between gap-3"><div><div className="font-bold text-sm">{item.condition} • {formatIQD(item.supplierPrice)}</div>{item.notes && <div className="text-xs text-slate-500">{item.notes}</div>}<div className="text-[10px] text-slate-400">Photos: {item.photoUrls?.length || 0}</div></div><div className="flex gap-2"><button onClick={() => editItem(index)} className="text-xs font-bold text-blue-600">Edit</button><button onClick={() => removeItem(index)} className="text-xs font-bold text-red-600">Remove</button></div></div>
        </div>)}
      </div>}

      {error && <div className="text-xs text-red-600 bg-red-50 rounded-xl p-2">{error}</div>}
      <button onClick={submitItems} disabled={!items.length || sending} className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black disabled:opacity-40">{sending ? 'Submitting...' : `Submit ${items.length || ''} Offer Item${items.length === 1 ? '' : 's'}`}</button>
    </>}
  </div>;
}
