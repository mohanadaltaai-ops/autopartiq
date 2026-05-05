import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, formatIQD, uploadImage } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { carData, years } from '../data/carData';
import OfferCard from '../components/customer/OfferCard';
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

function requestStatusLabel(status, t) {
  if (status === 'WAITING') return t('pending');
  if (status === 'CANCELLED') return t('cancelled');
  return status;
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

function customerPaymentStatusLabel(status, t) {
  const labels = {
    PENDING: t('pending'),
    PAID: t('paid'),
    FAILED: t('failed'),
    REFUNDED: t('refunded')
  };
  return labels[status] || status;
}

export default function Customer({ tab }) {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [homeTab, setHomeTab] = useState('new');
  const [requestFilter, setRequestFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [targetRequestId, setTargetRequestId] = useState('');

  async function load() {
    try {
      setError('');
      const [r, o] = await Promise.all([
        api('/requests/mine', { token }),
        api('/orders/mine', { token })
      ]);
      setRequests(r.requests || []);
      setOrders(o.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openNotificationTarget(metadata) {
    if (!metadata?.requestId) return;
    setHomeTab('requests');
    setRequestFilter('ALL');
    setTargetRequestId(metadata.requestId);
  }

  useEffect(() => {
    const storedTarget = localStorage.getItem('notificationTarget');
    if (storedTarget) {
      try {
        openNotificationTarget(JSON.parse(storedTarget));
      } catch {}
      localStorage.removeItem('notificationTarget');
    }

    function handleNotificationNavigation(event) {
      openNotificationTarget(event.detail);
    }

    window.addEventListener('autopartiq:navigate-notification', handleNotificationNavigation);
    return () => window.removeEventListener('autopartiq:navigate-notification', handleNotificationNavigation);
  }, []);

  useEffect(() => { load(); }, [token]);

  const visibleRequests = useMemo(() => {
    return requests.filter(req => {
      if (requestFilter === 'PENDING') return req.status === 'WAITING';
      if (requestFilter === 'CANCELLED') return req.status === 'CANCELLED';
      return ['WAITING', 'CANCELLED'].includes(req.status);
    });
  }, [requests, requestFilter]);

  if (loading) return <div className="p-4 text-slate-500">{t('loadingCustomer')}</div>;
  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;
  if (tab === 'orders') return <OrderList orders={orders} />;

  return <div className="p-4 space-y-4">
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

    <div className="rounded-3xl bg-gradient-to-br from-orange-600 to-orange-500 text-white p-5 shadow">
      <div className="text-sm opacity-80">{t('hello')} {user?.name}</div>
      <div className="text-xl font-black">{t('findParts')}</div>
    </div>

    <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl border p-2">
      <button
        onClick={() => setHomeTab('new')}
        className={`py-2 rounded-xl text-sm font-bold ${homeTab === 'new' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}
      >
        {t('newRequest')}
      </button>
      <button
        onClick={() => setHomeTab('requests')}
        className={`py-2 rounded-xl text-sm font-bold ${homeTab === 'requests' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}
      >
        {t('myRequests')}
      </button>
    </div>

    {homeTab === 'new'
      ? <RequestForm token={token} onDone={async () => {
          await load();
          setToast({ message: t('requestSubmitted'), type: 'success' });
          setHomeTab('requests');
        }} />
      : <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-slate-900">{t('myRequests')}</h2>
            <select
              className="p-2 rounded-xl border bg-white text-xs font-bold"
              value={requestFilter}
              onChange={e => setRequestFilter(e.target.value)}
            >
              <option value="PENDING">{t('pending')}</option>
              <option value="CANCELLED">{t('cancelled')}</option>
              <option value="ALL">{t('pendingCancelled')}</option>
            </select>
          </div>
          {visibleRequests.length === 0 && <Empty text={t('noMatchingRequests')} />}
          {visibleRequests.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              token={token}
              reload={load}
              onToast={setToast}
              focus={targetRequestId === req.id}
            />
          ))}
        </div>}
  </div>;
}

function RequestCard({ req, token, reload, onToast, focus }) {
  const { t } = useLanguage();
  const requestPhotos = parseJsonArray(req.photoUrlsJson);
  const activeOffers = req.offers?.filter(o => o.status === 'ACTIVE') || [];
  const totalOffers = req.offers?.length || 0;
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const canCancel = req.status === 'WAITING';

  useEffect(() => {
    if (focus) {
      setOpen(true);
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }, [focus]);

  async function cancel() {
    try {
      setError('');
      await api(`/requests/${req.id}/cancel`, { method: 'PATCH', token, body: { reason } });
      onToast?.({ message: t('requestCancelled'), type: 'success' });
      await reload();
    } catch (e) {
      setError(e.message);
      onToast?.({ message: e.message, type: 'error' });
    }
  }

  return <div ref={cardRef} className={`bg-white rounded-2xl border p-4 space-y-3 shadow-sm ${focus ? 'ring-2 ring-orange-500' : ''}`}>
    <button onClick={() => setOpen(value => !value)} className="w-full text-left flex justify-between gap-3">
      <div>
        <div className="font-bold">{req.partName}</div>
        <div className="text-xs text-slate-500">{req.make} {req.model} ({req.year})</div>
        <div className="text-[11px] text-orange-600 font-bold mt-1">{t('offers')}: {activeOffers.length} / {totalOffers}</div>
        {(req.partNumber || req.vin) && (
          <div className="text-[11px] text-slate-400 mt-1">
            {req.partNumber && `${t('partNumber')}: ${req.partNumber}`} {req.vin && `${t('vinChassis')}: ${req.vin}`}
          </div>
        )}
      </div>
      <div className="text-right">
        <span className={`text-[10px] px-2 py-1 rounded-full h-fit font-bold whitespace-nowrap inline-flex items-center shrink-0 ${req.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
          {requestStatusLabel(req.status, t)}
        </span>
        <div className="text-[10px] text-slate-400 mt-2">{open ? t('hide') : t('details')}</div>
      </div>
    </button>

    {open && <>
      <div className="rounded-xl bg-slate-50 p-3 space-y-1 text-xs">
        <div className="text-[10px] uppercase font-black text-slate-400">{t('requestDetails')}</div>
        <SummaryRow label={t('part')} value={req.partName} />
        <SummaryRow label={t('make')} value={`${req.make} ${req.model}`.trim()} />
        <SummaryRow label={t('year')} value={req.year} />
        {req.partNumber && <SummaryRow label={t('partNumber')} value={req.partNumber} />}
        {req.vin && <SummaryRow label={t('vinChassis')} value={req.vin} />}
        <SummaryRow label={t('offers')} value={`${activeOffers.length} / ${totalOffers}`} />
      </div>

      {req.description && <div className="text-xs bg-slate-50 text-slate-600 rounded-xl p-2">{req.description}</div>}
      {req.cancellationReason && <div className="text-xs bg-red-50 text-red-700 rounded-xl p-2">{t('reasonForCancellation')}: {req.cancellationReason}</div>}

      {requestPhotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {requestPhotos.map(url => <ImagePreview key={url} src={url} alt="Request" className="w-16 h-16 rounded-xl object-cover border" />)}
        </div>
      )}

      <div className="space-y-2">
        {activeOffers.map(o => <OfferCard key={o.id} offer={o} token={token} reload={reload} />)}
      </div>

      {canCancel && <div className="border-t pt-3 space-y-2">
        {!showCancel ? (
          <button onClick={() => setShowCancel(true)} className="text-xs font-bold text-red-600">{t('cancelRequest')}</button>
        ) : <>
          <textarea
            className="w-full p-3 rounded-xl border text-sm"
            placeholder={t('reasonForCancellation')}
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex gap-2">
            <button onClick={cancel} disabled={!reason.trim()} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40">{t('confirmCancel')}</button>
            <button onClick={() => setShowCancel(false)} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold">{t('keepRequest')}</button>
          </div>
        </>}
      </div>}
    </>}
  </div>;
}

function RequestForm({ token, onDone }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    origin: '',
    make: '',
    model: '',
    year: '',
    partName: '',
    description: '',
    partNumber: '',
    vin: '',
    customerPhone: '',
    location: '',
    photoUrls: []
  });
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const makes = form.origin ? Object.keys(carData[form.origin].makes) : [];
  const models = form.origin && form.make ? carData[form.origin].makes[form.make] || [] : [];

  async function ai() {
    if (!problem.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await api('/ai/identify-part', { method: 'POST', token, body: { problem } });
      setForm(f => ({ ...f, partName: r.partName, description: r.description }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(file) {
    if (!file) return;
    if (form.photoUrls.length >= 4) return setError(t('upload4'));
    setUploading(true);
    setError('');
    try {
      const result = await uploadImage(file, { token, context: 'request' });
      setForm(f => ({ ...f, photoUrls: [...f.photoUrls, result.url].slice(0, 4) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function removePhotoUrl(index) {
    setForm(f => ({ ...f, photoUrls: f.photoUrls.filter((_, photoIndex) => photoIndex !== index) }));
  }

  async function submit() {
    try {
      setSaving(true);
      setError('');
      await api('/requests', { method: 'POST', token, body: form });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="bg-white rounded-3xl border p-4 space-y-3 shadow-sm">
    <select className="w-full p-3 rounded-xl border" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value, make: '', model: '' })}>
      <option value="">{t('selectOrigin')}</option>
      {Object.keys(carData).map(o => <option key={o} value={o}>{o}</option>)}
    </select>

    <select className="w-full p-3 rounded-xl border" value={form.make} disabled={!form.origin} onChange={e => setForm({ ...form, make: e.target.value, model: '' })}>
      <option value="">{t('selectMake')}</option>
      {makes.map(m => <option key={m} value={m}>{m}</option>)}
    </select>

    <select className="w-full p-3 rounded-xl border" value={form.model} disabled={!form.make} onChange={e => setForm({ ...form, model: e.target.value })}>
      <option value="">{t('selectModel')}</option>
      {models.map(m => <option key={m} value={m}>{m}</option>)}
    </select>

    <select className="w-full p-3 rounded-xl border" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
      <option value="">{t('selectYear')}</option>
      {years.map(y => <option key={y} value={y}>{y}</option>)}
    </select>

    <div className="bg-orange-50 rounded-2xl p-3 space-y-2">
      <input className="w-full p-3 rounded-xl border" placeholder={t('describeProblem')} value={problem} onChange={e => setProblem(e.target.value)} />
      <button onClick={ai} disabled={loading || !problem.trim()} className="w-full py-2 rounded-xl bg-orange-600 text-white font-bold disabled:opacity-40">
        {loading ? t('analyzing') : t('aiIdentify')}
      </button>
    </div>

    <input className="w-full p-3 rounded-xl border" placeholder={t('partName')} value={form.partName} onChange={e => setForm({ ...form, partName: e.target.value })} />

    <div className="grid grid-cols-2 gap-2">
      <input className="w-full p-3 rounded-xl border" placeholder={t('partNumber')} value={form.partNumber} onChange={e => setForm({ ...form, partNumber: e.target.value })} />
      <input className="w-full p-3 rounded-xl border" placeholder={t('vinChassis')} value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} />
    </div>

    <textarea className="w-full p-3 rounded-xl border" placeholder={t('description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

    <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
      <div className="text-xs font-bold text-slate-500">{t('requestPhotosUpTo4')}</div>
      <label className="block w-full py-3 rounded-xl bg-slate-900 text-white text-center text-sm font-bold cursor-pointer">
        {uploading ? t('uploading') : t('uploadPhoto')}
        <input type="file" accept="image/*" className="hidden" disabled={uploading || form.photoUrls.length >= 4} onChange={e => handlePhotoUpload(e.target.files?.[0])} />
      </label>
      <div className="text-[10px] text-slate-400">{t('imageHelp')}</div>

      {form.photoUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {form.photoUrls.map((url, index) => (
            <div key={url} className="relative">
              <ImagePreview src={url} alt="Request preview" className="w-16 h-16 rounded-xl object-cover border" />
              <button onClick={() => removePhotoUrl(index)} type="button" className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold whitespace-nowrap inline-flex items-center shrink-0">×</button>
            </div>
          ))}
        </div>
      )}
    </div>

    <input className="w-full p-3 rounded-xl border" placeholder={t('yourPhone')} value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} />
    <input className="w-full p-3 rounded-xl border" placeholder={t('detailedLocation')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />

    {error && <div className="text-xs text-red-600">{error}</div>}

    <button
      onClick={submit}
      disabled={!form.origin || !form.make || !form.model || !form.year || !form.partName || !form.customerPhone || !form.location || saving}
      className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black disabled:opacity-40"
    >
      {saving ? t('uploading') : t('submitRequest')}
    </button>
  </div>;
}

function CustomerOrderCard({ order }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const partPrice = Number(order.customerPrice || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = partPrice + deliveryFee;

  return <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
    <button onClick={() => setOpen(value => !value)} className="w-full text-left flex items-start justify-between gap-3">
      <div>
        <div className="font-black text-orange-600">{order.orderNumber}</div>
        <div className="font-bold text-slate-900">{order.offer.request.partName}</div>
        <div className="text-xs text-slate-500">{order.offer.request.make} {order.offer.request.model}</div>
        <div className="text-xs text-slate-500 mt-1">{t('paymentStatus')}: {customerPaymentStatusLabel(order.paymentStatus, t)}</div>
        <div className="text-sm mt-2 font-bold text-slate-700">{t('total')}: {formatIQD(total)}</div>
      </div>
      <div className="text-right">
        <span className="inline-block text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap inline-flex items-center shrink-0">{orderStatusLabel(order.status, t)}</span>
        <div className="text-[10px] text-slate-400 mt-2">{open ? t('hide') : t('details')}</div>
      </div>
    </button>
    {open && <>
      <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
        <div className="text-[10px] uppercase font-black text-slate-400">{t('priceBreakdown')}</div>
        <SummaryRow label={t('price')} value={formatIQD(partPrice)} />
        <SummaryRow label={t('deliveryFee')} value={formatIQD(deliveryFee)} />
        <SummaryRow label={t('total')} value={formatIQD(total)} />
      </div>

      <OrderInfoPanel order={order} />
      <DeliveryWorkflow status={order.status} />
    </>}
  </div>;
}

function OrderList({ orders }) {
  const { t } = useLanguage();
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return <div className="p-4 space-y-3">
    <h1 className="font-black text-xl">{t('orders')}</h1>
    {sortedOrders.length === 0 && <Empty text={t('noOrders')} />}
    {sortedOrders.map(order => <CustomerOrderCard key={order.id} order={order} />)}
  </div>;
}
