import React, { useEffect, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import DeliveryWorkflow from '../components/orders/DeliveryWorkflow';

export default function Supplier({ tab }) {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [l, o] = await Promise.all([api('/requests/supplier/leads', { token }), api('/orders/mine', { token })]);
      setLeads(l.requests || []);
      setOrders(o.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  if (loading) return <div className="p-4 text-slate-500">Loading supplier workspace...</div>;
  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;

  if (tab === 'orders') return <div className="p-4 space-y-3"><h1 className="font-black text-xl">Active Orders</h1>{orders.length === 0 && <Empty text="No accepted orders yet." />}{orders.map(o => <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm space-y-3"><div><div className="font-bold">{o.offer.request.partName}</div><div className="text-xs text-slate-500">{o.offer.request.make} {o.offer.request.model} • {o.offer.condition}</div><div className="text-xs text-slate-500 mt-1">Earnings: {formatIQD(o.supplierPrice)}</div><div className="text-[10px] mt-2 inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{o.status}</div></div><DeliveryWorkflow status={o.status} /><button onClick={async () => { await api(`/orders/${o.id}/status`, { method:'PATCH', token, body:{status:'COMPLETED'} }); load(); }} className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold">Mark Completed</button></div>)}</div>;
  if (tab === 'earnings') return <Earnings orders={orders} />;
  return <div className="p-4 space-y-3"><div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 text-white p-5 shadow"><div className="text-sm opacity-80">Supplier workspace</div><div className="text-xl font-black">Matching Leads</div></div>{leads.length === 0 && <Empty text="No matching leads yet." />}{leads.map(req => <Lead key={req.id} req={req} token={token} reload={load} />)}</div>;
}

function Empty({ text }) {
  return <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">{text}</div>;
}

function Earnings({ orders }) {
  const total = orders.reduce((s, o) => s + o.supplierPrice, 0);
  const completed = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.supplierPrice, 0);
  const processing = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').reduce((s, o) => s + o.supplierPrice, 0);

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
    {orders.length === 0 && <Empty text="No earnings transactions yet." />}
    {orders.map(o => <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm flex justify-between gap-3">
      <div>
        <div className="font-bold text-slate-900">{o.offer.request.partName}</div>
        <div className="text-xs text-slate-500">{o.orderNumber} • {o.status}</div>
      </div>
      <div className="font-black text-blue-600">{formatIQD(o.supplierPrice)}</div>
    </div>)}
  </div>;
}

function Lead({ req, token, reload }) {
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    try {
      setSending(true);
      setError('');
      const photoUrls = photoUrl.trim() ? [photoUrl.trim()] : [];
      await api(`/offers/request/${req.id}`, { method:'POST', token, body:{ supplierPrice:Number(price), condition, notes, photoUrls } });
      setPrice('');
      setNotes('');
      setPhotoUrl('');
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return <div className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm">
    <div><div className="font-bold">{req.partName}</div><div className="text-xs text-slate-500">{req.make} {req.model} ({req.year})</div><p className="text-xs text-slate-500 mt-1">{req.description}</p></div>
    <input className="w-full p-3 rounded-xl border" placeholder="Net price IQD" value={price} onChange={e => setPrice(e.target.value)} inputMode="numeric" />
    <select className="w-full p-3 rounded-xl border" value={condition} onChange={e => setCondition(e.target.value)}><option value="NEW">New</option><option value="USED">Used</option></select>
    <input className="w-full p-3 rounded-xl border" placeholder="Photo URL optional" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
    {photoUrl && <img src={photoUrl} alt="Offer preview" className="w-full h-28 object-cover rounded-xl border" onError={event => { event.currentTarget.style.display = 'none'; }} />}
    <input className="w-full p-3 rounded-xl border" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
    {error && <div className="text-xs text-red-600">{error}</div>}
    <button onClick={send} disabled={!price || sending} className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black disabled:opacity-40">{sending ? 'Sending...' : 'Send Offer'}</button>
  </div>;
}
