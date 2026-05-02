import React, { useEffect, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

function StatCard({ label, value }) {
  return <div className="bg-white rounded-2xl border p-4">
    <div className="text-[10px] text-slate-400 font-bold uppercase">{label}</div>
    <div className="font-black text-slate-900 mt-1">{value}</div>
  </div>;
}

export default function Admin() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const result = await api('/admin/dashboard', { token });
      setData(result);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;
  if (!data) return <div className="p-4 text-slate-500">Loading dashboard...</div>;

  return <div className="p-4 space-y-4">
    <h1 className="font-black text-xl text-slate-900">Admin Dashboard</h1>
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Orders" value={data.summary.totalOrders} />
      <StatCard label="Requests" value={data.summary.totalRequests} />
      <StatCard label="Platform Revenue" value={formatIQD(data.summary.platformRevenue)} />
      <StatCard label="Supplier Earnings" value={formatIQD(data.summary.supplierEarnings)} />
    </div>
    <h2 className="font-black text-slate-900">Recent Orders</h2>
    {data.orders.map(order => <div key={order.id} className="bg-white rounded-2xl border p-4">
      <div className="font-black text-orange-600">{order.orderNumber}</div>
      <div className="font-bold text-slate-900">{order.offer.request.partName}</div>
      <div className="text-xs text-slate-500">Supplier: {order.offer.supplier.name}</div>
      <div className="text-xs text-slate-500 mt-2">Revenue: {formatIQD(order.platformRevenue)} • Status: {order.status}</div>
    </div>)}
  </div>;
}
