import React, { useEffect, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { carData, years } from '../data/carData';
import OfferCard from '../components/customer/OfferCard';
import DeliveryWorkflow from '../components/orders/DeliveryWorkflow';

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Customer({ tab }) {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [r, o] = await Promise.all([api('/requests/mine', { token }), api('/orders/mine', { token })]);
      setRequests(r.requests || []);
      setOrders(o.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  if (loading) return <div className="p-4 text-slate-500">Loading customer workspace...</div>;
  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;
  if (tab === 'orders') return <OrderList orders={orders} />;

  return <div className="p-4 space-y-4">
    <div className="rounded-3xl bg-gradient-to-br from-orange-600 to-orange-500 text-white p-5 shadow">
      <div className="text-sm opacity-80">Hello {user?.name}</div>
      <div className="text-xl font-black">Find car parts faster</div>
    </div>
    <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black">+ New Part Request</button>
    {showForm && <RequestForm token={token} onDone={() => { setShowForm(false); load(); }} />}
    <h2 className="font-black text-slate-900">My Requests</h2>
    {requests.length === 0 && <Empty text="No part requests yet." />}
    {requests.map(req => <RequestCard key={req.id} req={req} token={token} reload={load} />)}
  </div>;
}

function RequestCard({ req, token, reload }) {
  const requestPhotos = parseJsonArray(req.photoUrlsJson);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const canCancel = req.status === 'WAITING';

  async function cancel() {
    try {
      setError('');
      await api(`/requests/${req.id}/cancel`, { method: 'PATCH', token, body: { reason } });
      await reload();
    } catch (e) {
      setError(e.message);
    }
  }

  return <div className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm">
    <div className="flex justify-between">
      <div>
        <div className="font-bold">{req.partName}</div>
        <div className="text-xs text-slate-500">{req.make} {req.model} ({req.year})</div>
      </div>
      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full h-fit">{req.status}</span>
    </div>
    {req.cancellationReason && <div className="text-xs bg-red-50 text-red-700 rounded-xl p-2">Cancelled reason: {req.cancellationReason}</div>}
    {requestPhotos.length > 0 && <div className="flex gap-2 overflow-x-auto">{requestPhotos.map(url => <img key={url} src={url} alt="Request" className="w-16 h-16 rounded-xl object-cover border" />)}</div>}
    <div className="space-y-2">
      {req.offers?.filter(o => o.status === 'ACTIVE').map(o => <OfferCard key={o.id} offer={o} token={token} reload={reload} />)}
    </div>
    {canCancel && <div className="border-t pt-3 space-y-2">
      {!showCancel ? <button onClick={() => setShowCancel(true)} className="text-xs font-bold text-red-600">Cancel request</button> : <>
        <textarea className="w-full p-3 rounded-xl border text-sm" placeholder="Reason for cancellation optional" value={reason} onChange={e => setReason(e.target.value)} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="flex gap-2"><button onClick={cancel} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold">Confirm cancel</button><button onClick={() => setShowCancel(false)} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold">Keep request</button></div>
      </>}
    </div>}
  </div>;
}

function Empty({ text }) {
  return <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">{text}</div>;
}

function RequestForm({ token, onDone }) {
  const [form, setForm] = useState({ origin:'Japanese', make:'Toyota', model:'Camry', year: years[0], partName:'', description:'', customerPhone:'', location:'', photoUrls: [] });
  const [photoUrl, setPhotoUrl] = useState('');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const makes = Object.keys(carData[form.origin].makes);
  const models = carData[form.origin].makes[form.make] || [];

  async function ai() {
    if (!problem.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await api('/ai/identify-part', { method:'POST', token, body: { problem } });
      setForm(f => ({ ...f, partName: r.partName, description: r.description }));
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  function addPhotoUrl() {
    if (!photoUrl.trim()) return;
    setForm(f => ({ ...f, photoUrls: [...f.photoUrls, photoUrl.trim()].slice(0, 5) }));
    setPhotoUrl('');
  }

  async function submit() {
    try {
      setSaving(true);
      setError('');
      await api('/requests', { method:'POST', token, body: form });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="bg-white rounded-3xl border p-4 space-y-3 shadow-sm">
    <select className="w-full p-3 rounded-xl border" value={form.origin} onChange={e => { const origin = e.target.value; const make = Object.keys(carData[origin].makes)[0]; setForm({...form, origin, make, model: carData[origin].makes[make][0]}); }}>{Object.keys(carData).map(o => <option key={o}>{o}</option>)}</select>
    <select className="w-full p-3 rounded-xl border" value={form.make} onChange={e => setForm({...form, make:e.target.value, model: carData[form.origin].makes[e.target.value][0]})}>{makes.map(m => <option key={m}>{m}</option>)}</select>
    <select className="w-full p-3 rounded-xl border" value={form.model} onChange={e => setForm({...form, model:e.target.value})}>{models.map(m => <option key={m}>{m}</option>)}</select>
    <select className="w-full p-3 rounded-xl border" value={form.year} onChange={e => setForm({...form, year:e.target.value})}>{years.map(y => <option key={y}>{y}</option>)}</select>
    <div className="bg-orange-50 rounded-2xl p-3 space-y-2">
      <input className="w-full p-3 rounded-xl border" placeholder="Describe problem e.g. squeaking brakes" value={problem} onChange={e => setProblem(e.target.value)}/>
      <button onClick={ai} disabled={loading || !problem.trim()} className="w-full py-2 rounded-xl bg-orange-600 text-white font-bold disabled:opacity-40">{loading ? 'Analyzing...' : 'AI Identify Part'}</button>
    </div>
    <input className="w-full p-3 rounded-xl border" placeholder="Part name" value={form.partName} onChange={e => setForm({...form, partName:e.target.value})}/>
    <textarea className="w-full p-3 rounded-xl border" placeholder="Description" value={form.description} onChange={e => setForm({...form, description:e.target.value})}/>
    <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
      <div className="text-xs font-bold text-slate-500">Request photos structure</div>
      <div className="flex gap-2"><input className="flex-1 p-3 rounded-xl border" placeholder="Photo URL optional" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} /><button onClick={addPhotoUrl} type="button" className="px-3 rounded-xl bg-slate-900 text-white text-sm font-bold">Add</button></div>
      {form.photoUrls.length > 0 && <div className="flex gap-2 overflow-x-auto">{form.photoUrls.map(url => <img key={url} src={url} alt="Request preview" className="w-16 h-16 rounded-xl object-cover border" />)}</div>}
    </div>
    <input className="w-full p-3 rounded-xl border" placeholder="Your phone" value={form.customerPhone} onChange={e => setForm({...form, customerPhone:e.target.value})}/>
    <input className="w-full p-3 rounded-xl border" placeholder="Detailed location" value={form.location} onChange={e => setForm({...form, location:e.target.value})}/>
    {error && <div className="text-xs text-red-600">{error}</div>}
    <button onClick={submit} disabled={!form.partName || !form.customerPhone || !form.location || saving} className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black disabled:opacity-40">{saving ? 'Submitting...' : 'Submit Request'}</button>
  </div>;
}

function OrderList({ orders }) {
  return <div className="p-4 space-y-3"><h1 className="font-black text-xl">Orders</h1>{orders.length === 0 && <Empty text="No orders yet." />}{orders.map(o => <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm space-y-3"><div><div className="font-black text-orange-600">{o.orderNumber}</div><div className="font-bold">{o.offer.request.partName}</div><div className="text-xs text-slate-500">{o.offer.request.make} {o.offer.request.model}</div><div className="text-sm mt-2">Total: {formatIQD(o.customerPrice + o.deliveryFee)}</div><span className="inline-block mt-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{o.status}</span></div><DeliveryWorkflow status={o.status} /></div>)}</div>;
}
