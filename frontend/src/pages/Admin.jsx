import React, { useEffect, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { carData } from '../data/carData';
import AdminSupplierList from '../components/admin/AdminSupplierList';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import OrderPaymentControls from '../components/admin/OrderPaymentControls';
import OrderDeliveryControls from '../components/admin/OrderDeliveryControls';

function StatCard({ label, value }) {
  return <div className="bg-white rounded-2xl border p-4 shadow-sm">
    <div className="text-[10px] text-slate-400 font-bold uppercase">{label}</div>
    <div className="font-black text-slate-900 mt-1">{value}</div>
  </div>;
}

function StatusBadge({ status }) {
  const colors = {
    WAITING_PICKUP: 'bg-amber-100 text-amber-700',
    DELIVERING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700'
  };
  const labels = { WAITING_PICKUP: 'Waiting Pickup', DELIVERING: 'Delivering', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
  return <span className={`text-[10px] mt-2 inline-block px-2 py-1 rounded-full font-bold ${colors[status] || 'bg-slate-100 text-slate-600'}`}>{labels[status] || status}</span>;
}

export default function Admin({ tab }) {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', location: '', supportedMakes: ['Japanese'] });
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  async function changeOrderStatus(orderId, status) {
    setUpdatingOrderId(orderId);
    try {
      await api(`/orders/${orderId}/status`, { method: 'PATCH', token, body: { status } });
      await load();
    } finally {
      setUpdatingOrderId('');
    }
  }

  useEffect(() => { load(); }, []);

  if (error) return <div className="p-4 text-red-600 text-sm">{error}</div>;
  if (!data) return <div className="p-4 text-slate-500">Loading dashboard...</div>;

  if (tab === 'audit') {
    return <div className="p-4 space-y-4"><h1 className="font-black text-xl text-slate-900">Audit Logs</h1><AuditLogViewer token={token} /></div>;
  }

  if (tab === 'suppliers') {
    return <div className="p-4 space-y-4">
      <h1 className="font-black text-xl text-slate-900">Suppliers</h1>
      <div className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm">
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
      <AdminSupplierList suppliers={data.suppliers} token={token} reload={load} />
    </div>;
  }

  if (tab === 'orders') {
    const filteredOrders = data.orders.filter(order => {
      const matchesSearch = !orderSearch || order.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return <div className="p-4 space-y-3">
      <h1 className="font-black text-xl text-slate-900">All Orders</h1>
      <div className="bg-white rounded-2xl border p-3 space-y-2">
        <input className="w-full p-3 rounded-xl border text-sm" placeholder="Search order number" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
        <select className="w-full p-3 rounded-xl border text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="WAITING_PICKUP">Waiting Pickup</option>
          <option value="DELIVERING">Delivering</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      {filteredOrders.length === 0 && <div className="bg-white border border-dashed rounded-2xl p-6 text-center text-sm text-slate-400">No matching orders.</div>}
      {filteredOrders.map(order => <div key={order.id} className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-black text-orange-600">{order.orderNumber}</div>
            <div className="font-bold text-slate-900">{order.offer.request.partName}</div>
            <div className="text-xs text-slate-500">Supplier: {order.offer.supplier.name}</div>
            <div className="text-xs text-slate-500">Customer phone: {order.offer.request.customerPhone || 'N/A'}</div>
            <div className="text-xs text-slate-500">Location: {order.offer.request.location || 'N/A'}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="text-xs text-slate-500 grid grid-cols-2 gap-1">
          {user?.role === 'SUPER_ADMIN' && <><span>Supplier: {formatIQD(order.supplierPrice)}</span><span>Customer: {formatIQD(order.customerPrice)}</span><span>Revenue: {formatIQD(order.platformRevenue)}</span></>}
          <span>Delivery: {formatIQD(order.deliveryFee)}</span>
          <span>Payment: {order.paymentMethod}</span>
          <span>Status: {order.paymentStatus}</span>
          <span>Driver: {order.driverName || 'Not assigned'}</span>
          <span>ETA: {order.deliveryEta || 'Pending'}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'DELIVERING')} className="text-[11px] py-2 rounded-xl bg-blue-50 text-blue-700 font-bold disabled:opacity-40">Delivering</button>
          <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'COMPLETED')} className="text-[11px] py-2 rounded-xl bg-green-50 text-green-700 font-bold disabled:opacity-40">Completed</button>
          <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'CANCELLED')} className="text-[11px] py-2 rounded-xl bg-red-50 text-red-700 font-bold disabled:opacity-40">Cancel</button>
        </div>
        <OrderPaymentControls order={order} token={token} reload={load} />
        <OrderDeliveryControls order={order} token={token} reload={load} />
      </div>)}
    </div>;
  }

  return <div className="p-4 space-y-4">
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-5 shadow">
      <div className="text-sm opacity-70">Platform overview</div>
      <div className="text-xl font-black">AutoPartIQ Admin</div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Orders" value={data.summary.totalOrders} />
      <StatCard label="Active Orders" value={data.summary.activeOrders ?? data.summary.totalOrders} />
      <StatCard label="Requests" value={data.summary.totalRequests} />
      <StatCard label="Suppliers" value={data.summary.suppliers} />
      {user?.role === 'SUPER_ADMIN' && <><StatCard label="Platform Revenue" value={formatIQD(data.summary.platformRevenue)} /><StatCard label="Supplier Earnings" value={formatIQD(data.summary.supplierEarnings)} /></>}
    </div>
    <h2 className="font-black text-slate-900">Suppliers</h2>
    <AdminSupplierList suppliers={data.suppliers.slice(0, 3)} token={token} reload={load} />
  </div>;
}
