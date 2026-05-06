import React, { useEffect, useState } from 'react';
import { api, formatIQD } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { carData } from '../data/carData';
import AdminSupplierList from '../components/admin/AdminSupplierList';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import OrderPaymentControls from '../components/admin/OrderPaymentControls';
import OrderDeliveryControls from '../components/admin/OrderDeliveryControls';
import SuperAdminEnroll from '../components/admin/SuperAdminEnroll';
import AdminPayoutManager from '../components/admin/AdminPayoutManager';

function StatCard({ label, value }) {
  return <div className="rounded-[1.35rem] border border-blue-100/80 bg-white/95 p-4 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/20">
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{label}</div>
    <div className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">{value}</div>
  </div>;
}

function statusLabel(status, t) {
  const labels = {
    WAITING_PICKUP: t('waitingPickup'),
    DELIVERING: t('delivering'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled')
  };
  return labels[status] || status;
}

function paymentMethodLabel(method, t) {
  const labels = {
    CASH_ON_DELIVERY: t('cashOnDelivery'),
    CARD: t('card'),
    WALLET: t('wallet'),
    BANK_TRANSFER: t('bankTransfer')
  };
  return labels[method] || method;
}

function paymentStatusLabel(status, t) {
  const labels = {
    PENDING: t('pending'),
    PAID: t('paid'),
    FAILED: t('failed'),
    REFUNDED: t('refunded')
  };
  return labels[status] || status;
}

function StatusBadge({ status }) {
  const { t } = useLanguage();
  const colors = {
    WAITING_PICKUP: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20',
    DELIVERING: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20',
    CANCELLED: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-400/20'
  };

  return <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${colors[status] || 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
    {statusLabel(status, t)}
  </span>;
}

function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function isDateInRange(value, fromDate, toDate) {
  if (!fromDate && !toDate) return true;
  const orderDate = new Date(value);
  if (Number.isNaN(orderDate.getTime())) return true;

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`);
    if (orderDate < from) return false;
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59`);
    if (orderDate > to) return false;
  }

  return true;
}

function AdminOrderCard({ order, user, updatingOrderId, changeOrderStatus, token, reload }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return <div className="space-y-3 rounded-[1.5rem] border border-blue-100/80 bg-white/95 p-4 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/20">
    <button onClick={() => setOpen(value => !value)} className="w-full text-left flex items-start justify-between gap-3">
      <div>
        <div className="font-black text-orange-600">{order.orderNumber}</div>
        <div className="font-black text-slate-950 dark:text-white">{order.offer.request.partName}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">{t('created')}: {toDateInputValue(order.createdAt) || t('notAvailable')}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('supplier')}: {order.offer.supplier.name}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('customerPhone')}: {order.offer.request.customerPhone || t('notAvailable')}</div>
      </div>

      <div className="text-right">
        <StatusBadge status={order.status} />
        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">{open ? t('hide') : t('details')}</div>
      </div>
    </button>

    {open && <>
      <div className="space-y-2 text-xs">
        <div className="space-y-1 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('partDetails')}</div>
          <div className="font-bold text-slate-800 dark:text-slate-100">{order.offer.request.partName}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{order.offer.request.origin} / {order.offer.request.make} / {order.offer.request.model} / {order.offer.request.year}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('condition')}: {order.offer.condition === 'NEW' ? t('new') : t('used')}</div>
        </div>

        <div className="space-y-1 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('customer')}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('customerPhone')}: {order.offer.request.customerPhone || t('notAvailable')}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('location')}: {order.offer.request.location || t('notAvailable')}</div>
        </div>

        <div className="space-y-1 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('supplier')}</div>
          <div className="font-bold text-slate-800 dark:text-slate-100">{order.offer.supplier.name}</div>
          {user?.role === 'SUPER_ADMIN' && (
            <div className="grid grid-cols-1 gap-1 pt-1">
              <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('supplier')}: {formatIQD(order.supplierPrice)}</div>
              <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('customer')}: {formatIQD(order.customerPrice)}</div>
              <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('revenue')}: {formatIQD(order.platformRevenue)}</div>
            </div>
          )}
        </div>

        <div className="space-y-1 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('payment')}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('payment')}: {paymentMethodLabel(order.paymentMethod, t)}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('status')}: {paymentStatusLabel(order.paymentStatus, t)}</div>
        </div>

        <div className="space-y-1 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('delivery')}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('delivery')}: {formatIQD(order.deliveryFee)}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('driver')}: {order.driverName || t('notAssigned')}</div>
          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('deliveryEta')}: {order.deliveryEta || t('pending')}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'DELIVERING')} className="text-[11px] py-2 rounded-xl bg-blue-50 text-blue-700 font-bold disabled:opacity-40">{t('delivering')}</button>
        <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'COMPLETED')} className="text-[11px] py-2 rounded-xl bg-green-50 text-green-700 font-bold disabled:opacity-40">{t('completed')}</button>
        <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'CANCELLED')} className="text-[11px] py-2 rounded-xl bg-red-50 text-red-700 font-bold disabled:opacity-40">{t('cancel')}</button>
      </div>

      <OrderPaymentControls order={order} token={token} reload={reload} />
      <OrderDeliveryControls order={order} token={token} reload={reload} />
    </>}
  </div>;
}

export default function Admin({ tab, setTab }) {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', location: '', supportedMakes: ['Japanese'] });
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
  if (!data) return <div className="p-4 text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('loadingDashboard')}</div>;

  if (user?.role === 'ADMIN' && user?.adminPermission === 'ORDERS_ONLY' && tab !== 'orders') {
    return <div className="p-4 text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('ordersOnlyAdminAccess')}</div>;
  }

  if (tab === 'manage') {
    if (user?.role !== 'SUPER_ADMIN') return <div className="p-4 text-red-600 text-sm">{t('superAdminOnlyUsers')}</div>;

    return <div className="p-4 space-y-4">
      <div className="rounded-[1.6rem] bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-5 text-white shadow-lg shadow-blue-950/20">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">{t('users')}</div>
      <h1 className="mt-1 text-2xl font-black tracking-tight">{t('adminUsers')}</h1>
    </div>
      <SuperAdminEnroll token={token} />
    </div>;
  }

  if (tab === 'audit') {
    return <div className="p-4 space-y-4">
      <div className="rounded-[1.6rem] bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-5 text-white shadow-lg shadow-blue-950/20">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">{t('audit')}</div>
      <h1 className="mt-1 text-2xl font-black tracking-tight">{t('auditLogs')}</h1>
    </div>
      <AuditLogViewer token={token} />
    </div>;
  }

  if (tab === 'more') {
    return <div className="p-4 space-y-4">
      <div className="rounded-[1.6rem] bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-5 text-white shadow-lg shadow-blue-950/20">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">{t('adminDashboard')}</div>
      <h1 className="mt-1 text-2xl font-black tracking-tight">{t('more')}</h1>
    </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setTab('audit')}
          className="bg-white rounded-3xl border p-4 shadow-sm text-left min-h-32 flex flex-col justify-between"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl">🛡️</div>
          <div>
            <div className="font-black text-slate-950 dark:text-white">{t('auditLogs')}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('audit')}</div>
          </div>
        </button>

        {user?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setTab('manage')}
            className="bg-white rounded-3xl border p-4 shadow-sm text-left min-h-32 flex flex-col justify-between"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl">👥</div>
            <div>
              <div className="font-black text-slate-950 dark:text-white">{t('adminUsers')}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('users')}</div>
            </div>
          </button>
        )}
      </div>
    </div>;
  }

  if (tab === 'suppliers') {
    return <div className="p-4 space-y-4">
      <div className="rounded-[1.6rem] bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-5 text-white shadow-lg shadow-blue-950/20">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">{t('adminDashboard')}</div>
      <h1 className="mt-1 text-2xl font-black tracking-tight">{t('suppliers')}</h1>
    </div>

      <div className="space-y-4 rounded-[1.5rem] border border-blue-100/80 bg-white/95 p-4 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/20">
        <div>
          <div className="font-black text-slate-950 dark:text-white">{t('addSupplier')}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">{t('addSupplierHint')}</div>
        </div>

        <div className="space-y-2 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('supplierDetails')}</div>
          <input className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" placeholder={t('supplierName')} value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          <input className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" placeholder={t('phone')} value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
          <input className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" placeholder={t('location')} value={supplierForm.location} onChange={e => setSupplierForm({ ...supplierForm, location: e.target.value })} />
        </div>

        <div className="space-y-2 rounded-2xl bg-blue-50/70 p-3 dark:bg-slate-800/80">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('supportedMakes')}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">{t('supportedMakesHint')}</div>
            </div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">
              {supplierForm.supportedMakes.length} / {Object.keys(carData).length}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.keys(carData).map(origin => <label key={origin} className={`text-xs rounded-xl p-2 flex gap-2 items-center border ${supplierForm.supportedMakes.includes(origin) ? 'border-blue-200 bg-blue-50 font-black text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-300' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type="checkbox" checked={supplierForm.supportedMakes.includes(origin)} onChange={e => setSupplierForm(current => ({
                ...current,
                supportedMakes: e.target.checked ? [...current.supportedMakes, origin] : current.supportedMakes.filter(item => item !== origin)
              }))} />
              <span>{origin}</span>
            </label>)}
          </div>
        </div>

        <button onClick={addSupplier} disabled={!supplierForm.name || !supplierForm.phone || !supplierForm.location} className="w-full py-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-black disabled:opacity-40">
          {t('addSupplier')}
        </button>
      </div>

      <AdminSupplierList suppliers={data.suppliers} token={token} reload={load} />
    </div>;
  }


  if (tab === 'settlements') {
    return <div className="p-4 space-y-4">
      <div className="rounded-[1.6rem] bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-5 text-white shadow-lg shadow-blue-950/20">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">{t('suppliers')}</div>
      <h1 className="mt-1 text-2xl font-black tracking-tight">{t('supplierSettlements')}</h1>
    </div>
      <AdminPayoutManager token={token} />
    </div>;
  }
  if (tab === 'orders') {
    const filteredOrders = [...data.orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter(order => {
        const search = orderSearch.toLowerCase();
        const matchesSearch = !search || order.orderNumber?.toLowerCase().includes(search) || order.offer?.request?.partName?.toLowerCase().includes(search) || order.offer?.supplier?.name?.toLowerCase().includes(search);
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'OPEN' && ['WAITING_PICKUP', 'DELIVERING'].includes(order.status)) ||
          order.status === statusFilter;
        const matchesPayment = paymentStatusFilter === 'ALL' || order.paymentStatus === paymentStatusFilter;
        const matchesDate = isDateInRange(order.createdAt, dateFrom, dateTo);
        return matchesSearch && matchesStatus && matchesPayment && matchesDate;
      });

    return <div className="p-4 space-y-3">
      <div className="rounded-[1.6rem] bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-5 text-white shadow-lg shadow-blue-950/20">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">{t('adminDashboard')}</div>
      <h1 className="mt-1 text-2xl font-black tracking-tight">{t('allOrders')}</h1>
    </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => setStatusFilter('ALL')} className={`py-2 rounded-xl text-[11px] font-bold ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'}`}>
          {t('all')}
        </button>
        <button onClick={() => setStatusFilter('OPEN')} className={`py-2 rounded-xl text-[11px] font-bold ${statusFilter === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>
          {t('activeOrders')}
        </button>
        <button onClick={() => setStatusFilter('COMPLETED')} className={`py-2 rounded-xl text-[11px] font-bold ${statusFilter === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-white border text-slate-600'}`}>
          {t('completed')}
        </button>
        <button onClick={() => setStatusFilter('CANCELLED')} className={`py-2 rounded-xl text-[11px] font-bold ${statusFilter === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-white border text-slate-600'}`}>
          {t('cancelled')}
        </button>
      </div>

      <div className="space-y-2 rounded-[1.5rem] border border-blue-100/80 bg-white/95 p-3 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95">
        <input className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" placeholder={t('searchOrderPartSupplier')} value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />

        <select className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">{t('allStatuses')}</option>
          <option value="OPEN">{t('activeOrders')}</option>
          <option value="WAITING_PICKUP">{t('waitingPickup')}</option>
          <option value="DELIVERING">{t('delivering')}</option>
          <option value="COMPLETED">{t('completed')}</option>
          <option value="CANCELLED">{t('cancelled')}</option>
        </select>

        <select className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)}>
          <option value="ALL">{t('allPayments')}</option>
          <option value="PENDING">{t('pending')}</option>
          <option value="PAID">{t('paid')}</option>
          <option value="FAILED">{t('failed')}</option>
          <option value="REFUNDED">{t('refunded')}</option>
        </select>

        <div className="grid grid-cols-1 gap-2">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 space-y-1">
            {t('from')}
            <input type="date" className="w-full min-w-0 rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </label>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 space-y-1">
            {t('to')}
            <input type="date" className="w-full min-w-0 rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </label>
        </div>

        {(orderSearch || statusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || dateFrom || dateTo) && <button onClick={() => { setOrderSearch(''); setStatusFilter('ALL'); setPaymentStatusFilter('ALL'); setDateFrom(''); setDateTo(''); }} className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
          {t('clearFilters')}
        </button>}

        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{t('showing')} {filteredOrders.length} {t('of')} {data.orders.length} {t('orders').toLowerCase()}</div>
      </div>

      {filteredOrders.length === 0 && <div className="bg-white border border-dashed rounded-2xl p-6 text-center text-sm text-slate-400 dark:text-slate-500">{t('noMatchingOrders')}</div>}

      {filteredOrders.map(order => <AdminOrderCard key={order.id} order={order} user={user} updatingOrderId={updatingOrderId} changeOrderStatus={changeOrderStatus} token={token} reload={load} />)}
    </div>;
  }

  return <div className="p-4 space-y-4">
    <div className="rounded-[1.8rem] bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 p-5 text-white shadow-lg shadow-blue-950/20">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100/80">{t('platformOverview')}</div>
      <div className="mt-1 text-2xl font-black tracking-tight">{t('adminDashboard')}</div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <StatCard label={t('orders')} value={data.summary.totalOrders} />
      <StatCard label={t('activeOrders')} value={data.summary.activeOrders ?? data.summary.totalOrders} />
      <StatCard label={t('waitingPickup')} value={data.summary.waitingPickupOrders ?? 0} />
      <StatCard label={t('delivering')} value={data.summary.deliveringOrders ?? 0} />
      <StatCard label={t('completed')} value={data.summary.completedOrders ?? 0} />
      <StatCard label={t('cancelled')} value={data.summary.cancelledOrders ?? 0} />
      <StatCard label={t('pendingPayments')} value={data.summary.pendingPayments ?? 0} />
      <StatCard label={t('paidOrders')} value={data.summary.paidOrders ?? 0} />
      <StatCard label={t('suppliers')} value={data.summary.suppliers} />
      <StatCard label={t('activeSuppliers')} value={data.summary.activeSuppliers ?? data.summary.suppliers} />
      {user?.role === 'SUPER_ADMIN' && (
        <StatCard label={t('platformRevenue')} value={formatIQD(data.summary.platformRevenue)} />
      )}
    </div>

    <h2 className="font-black text-slate-950 dark:text-white">{t('suppliers')}</h2>
    <AdminSupplierList suppliers={data.suppliers.slice(0, 3)} token={token} reload={load} />
  </div>;
}
