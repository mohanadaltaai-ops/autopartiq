import React, { useEffect, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { carData, years } from '../data/carData';

export default function Customer({ tab }) {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const [r, o] = await Promise.all([api('/requests/mine', { token }), api('/orders/mine', { token })]);
    setRequests(r.requests);
    setOrders(o.orders);
  }

  useEffect(() => { load(); }, []);

  if (tab === 'orders') return <OrderList orders={orders} />;

  return <div className="p-4 space-y-4">
    <div className="rounded-3xl bg-gradient-to-br from-orange-600 to-orange-500 text-white p-5 shadow">
      <div className="text-sm opacity-80">Hello {user?.name}</div>
      <div className="text-xl font-black">Find car parts faster</div>
    </div>
    <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black">+ New Part Request</button>
    {showForm && <RequestForm token={token} onDone={() => { setShowForm(false); load(); }} />}
    <h2 className="font-black text-slate-900">My Requests</h2>
    {requests.map(req => <div key={req.id} className="bg-white rounded-2xl border p-4 space-y-3">
      <div className="flex justify-between">
        <div>
          <div className="font-bold">{req.partName}</div>
          <div className="text-xs text-slate-500">{req.make} {req.model} ({req.year})</div>
        </div>
        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full h-fit">{req.status}</span>
      </div>
      <div className="space-y-2">
        {req.offers?.filter(o => o.status === 'ACTIVE').map(o => <div key={o.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Supplier {o.supplier?.id?.slice(-1).toUpperCase()}</div>
            <div className="font-bold">{formatIQD(o.customerPrice)}</div>
            <div className="text-xs">Delivery: 6,000 IQD • {o.condition}</div>
          </div>
          <button onClick={async () => { await api(`/offers/${o.id}/accept`, { method:'POST', token }); load(); }} className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-bold">Accept</button>
        </div>)}
      </div>
    </div>)}
  </div>;
}

function RequestForm({ token, onDone }) {
  const [form, setForm] = useState({ origin:'Japanese', make:'Toyota', model:'Camry', year: years[0], partName:'', description:'', customerPhone:'', location:'' });
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const makes = Object.keys(carData[form.origin].makes);
  const models = carData[form.origin].makes[form.make] || [];

  async function ai() {
    setLoading(true);
    try {
      const r = await api('/ai/identify-part', { method:'POST', token, body: { problem } });
      setForm(f => ({ ...f, partName: r.partName, description: r.description }));
    } finally { setLoading(false); }
  }

  async function submit() {
    await api('/requests', { method:'POST', token, body: form });
    onDone();
  }

  return <div className="bg-white rounded-3xl border p-4 space-y-3">
    <select className="w-full p-3 rounded-xl border" value={form.origin} onChange={e => { const origin = e.target.value; const make = Object.keys(carData[origin].makes)[0]; setForm({...form, origin, make, model: carData[origin].makes[make][0]}); }}>{Object.keys(carData).map(o => <option key={o}>{o}</option>)}</select>
    <select className="w-full p-3 rounded-xl border" value={form.make} onChange={e => setForm({...form, make:e.target.value, model: carData[form.origin].makes[e.target.value][0]})}>{makes.map(m => <option key={m}>{m}</option>)}</select>
    <select className="w-full p-3 rounded-xl border" value={form.model} onChange={e => setForm({...form, model:e.target.value})}>{models.map(m => <option key={m}>{m}</option>)}</select>
    <select className="w-full p-3 rounded-xl border" value={form.year} onChange={e => setForm({...form, year:e.target.value})}>{years.map(y => <option key={y}>{y}</option>)}</select>
    <div className="bg-orange-50 rounded-2xl p-3 space-y-2">
      <input className="w-full p-3 rounded-xl border" placeholder="Describe problem e.g. squeaking brakes" value={problem} onChange={e => setProblem(e.target.value)}/>
      <button onClick={ai} className="w-full py-2 rounded-xl bg-orange-600 text-white font-bold">{loading ? 'Analyzing...' : 'AI Identify Part'}</button>
    </div>
    <input className="w-full p-3 rounded-xl border" placeholder="Part name" value={form.partName} onChange={e => setForm({...form, partName:e.target.value})}/>
    <textarea className="w-full p-3 rounded-xl border" placeholder="Description" value={form.description} onChange={e => setForm({...form, description:e.target.value})}/>
    <input className="w-full p-3 rounded-xl border" placeholder="Your phone" value={form.customerPhone} onChange={e => setForm({...form, customerPhone:e.target.value})}/>
    <input className="w-full p-3 rounded-xl border" placeholder="Detailed location" value={form.location} onChange={e => setForm({...form, location:e.target.value})}/>
    <button onClick={submit} disabled={!form.partName} className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black disabled:opacity-40">Submit Request</button>
  </div>;
}

function OrderList({ orders }) {
  return <div className="p-4 space-y-3"><h1 className="font-black text-xl">Orders</h1>{orders.map(o => <div key={o.id} className="bg-white rounded-2xl border p-4"><div className="font-black text-orange-600">{o.orderNumber}</div><div className="font-bold">{o.offer.request.partName}</div><div className="text-xs text-slate-500">{o.offer.request.make} {o.offer.request.model}</div><div className="text-sm mt-2">Total: {formatIQD(o.customerPrice + o.deliveryFee)}</div><span className="inline-block mt-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{o.status}</span></div>)}</div>;
}
