import React, { useEffect, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { carData } from '../data/carData';

function StatCard({ label, value }) {
  return <div className="bg-white rounded-2xl border p-4">
    <div className="text-[10px] text-slate-400 font-bold uppercase">{label}</div>
    <div className="font-black text-slate-900 mt-1">{value}</div>
  </div>;
}

export default function Admin({ tab }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', location: '', supportedMakes: ['Japanese'] });

  async function load() {
    try {
      const result = await api('/admin/dashboard', { token });
      setData(result);
    } catch (e) {
      setError(e.message);
    }
  }

  async function addSupplier() {
    await api('/admin/suppliers', { method: 'POST', token, body: supplierForm });
    setSupplierForm({ name: '', phone: '', location: '', supportedMakes: ['Japanese'] });
    await load();
  }

  useEffect(() => { load(); }, []);

  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;
  if (!data) return <div className="p-4 text-slate-500">Loading dashboard...</div>;

  if (tab === 'suppliers') {
    return <div className="p-4 space-y-4">
      <h1 className="font-black text-xl text-slate-900">Suppliers</h1>
      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <input className="w-full p-3 rounded-xl border" placeholder="Supplier name" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
        <input className="w-full p-3 rounded-xl border" placeholder="Phone" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
        <input className="w-full p-3 rounded-xl border" placeholder="Location" value={supplierForm.location} onChange={e => setSupplierForm({ ...supplierForm, location: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(carData).map(origin => <label key={origin} className="text-xs bg-slate-50 rounded-xl p-2 flex gap-2 items-center">
            <input type="checkbox" checked={supplierForm.supportedMakes.includes(origin)} onChange={e => setSupplierForm(current => ({
              ...current,
              supportedMakes: e.target.checked ? [...current.supportedMakes, origin] : current.supportedMakes.filter(item => item !== origin)
            }))} />
            {origin}
          </label>)}
        </div>
        <button onClick={addSupplier} disabled={!supplierForm.name || !supplierForm.phone} className="w-full py-3 rounded-2xl bg-purple-600 text-white font-black disabled:opacity-40">Add Supplier</button>
      </div>
      {data.suppliers.map(supplier => <div key={supplier.id} className="bg-white rounded-2xl border p-4">
        <div className="font-bold text-slate-900">{supplier.name}</div>
        <div className="text-xs text-slate-500">{supplier.phone} • {supplier.location}</div>
        <div className="text-xs text-slate-400 mt-1">Makes: {JSON.parse(supplier.supportedMakesJson || '[]').join(', ')}</div>
      </div>)}
    </div>;
  }

  if (tab === 'orders') {
    return <div className="p-4 space-y-3">
      <h1 className="font-black text-xl text-slate-900">All Orders</h1>
      {data.orders.map(order => <div key={order.id} className="bg-white rounded-2xl border p-4">
        <div className="font-black text-orange-600">{order.orderNumber}</div>
        <div className="font-bold text-slate-900">{order.offer.request.partName}</div>
        <div className="text-xs text-slate-500">Supplier: {order.offer.supplier.name}</div>
        <div className="text-xs text-slate-500 mt-2">Supplier Price: {formatIQD(order.supplierPrice)}</div>
        <div className="text-xs text-slate-500">Customer Price: {formatIQD(order.customerPrice)}</div>
        <div className="text-xs text-slate-500">Revenue: {formatIQD(order.platformRevenue)}</div>
        <div className="text-[10px] mt-2 inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{order.status}</div>
      </div>)}
    </div>;
  }

  return <div className="p-4 space-y-4">
    <h1 className="font-black text-xl text-slate-900">Admin Dashboard</h1>
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Orders" value={data.summary.totalOrders} />
      <StatCard label="Requests" value={data.summary.totalRequests} />
      <StatCard label="Platform Revenue" value={formatIQD(data.summary.platformRevenue)} />
      <StatCard label="Supplier Earnings" value={formatIQD(data.summary.supplierEarnings)} />
    </div>
    <h2 className="font-black text-slate-900">Suppliers</h2>
    {data.suppliers.map(supplier => <div key={supplier.id} className="bg-white rounded-2xl border p-4">
      <div className="font-bold text-slate-900">{supplier.name}</div>
      <div className="text-xs text-slate-500">{supplier.location}</div>
    </div>)}
  </div>;
}
