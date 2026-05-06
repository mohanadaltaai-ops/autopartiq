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

function StatCard({ label, value, tone = 'blue' }) {
  const toneClass = tone === 'green'
    ? 'bg-green-50 text-green-700 border-green-100'
    : tone === 'red'
      ? 'bg-red-50 text-red-700 border-red-100'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-blue-50 text-blue-700 border-blue-100';

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 p-4 shadow-sm min-h-[112px] flex flex-col justify-between">
      <div className={`self-start max-w-full px-2.5 py-1 rounded-full border text-[9px] leading-tight font-black uppercase ${toneClass}`}>
        {label}
      </div>
      <div className="mt-3 text-[22px] leading-tight font-black tabular-nums text-slate-950 break-words">
        {value}
      </div>
    </div>
  );
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
  const { t, language } = useLanguage();
  const colors = {
    WAITING_PICKUP: 'bg-amber-50 text-amber-700 border-amber-100',
    DELIVERING: 'bg-blue-50 text-blue-700 border-blue-100',
    COMPLETED: 'bg-green-50 text-green-700 border-green-100',
    CANCELLED: 'bg-red-50 text-red-700 border-red-100'
  };

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black ${colors[status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
      {statusLabel(status, t)}
    </span>
  );
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

function buildVolumeSeries(items, days = 14, language = 'en') {
  const today = new Date();
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, label: date.toLocaleDateString(language === 'ar' ? 'ar-IQ' : undefined, { month: 'short', day: 'numeric' }), count: 0 };
  });

  const map = new Map(buckets.map(item => [item.key, item]));

  items.forEach(item => {
    const key = item?.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : '';
    if (map.has(key)) map.get(key).count += 1;
  });

  return buckets;
}

function RequestVolumeChart({ orders, t, language }) {
  const points = buildVolumeSeries(orders, 14, language);
  const max = Math.max(...points.map(point => point.count), 1);
  const width = 280;
  const height = 92;
  const xStep = width / Math.max(points.length - 1, 1);

  const coordinates = points.map((point, index) => {
    const x = index * xStep;
    const y = height - 10 - ((point.count / max) * 62);
    return { ...point, x, y };
  });

  const linePath = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const total = orders.length;
  const average = Math.round(total / Math.max(points.length, 1));

  return (
    <div className="bg-white rounded-[30px] border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black text-slate-950">{t('requestVolume') || 'Request volume'}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">{t('last30Days') || 'Last 30 days'}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-slate-950 tabular-nums">{total}</div>
          <div className="text-[10px] text-green-600 font-black">+12%</div>
        </div>
      </div>

      <div className="rounded-[24px] bg-slate-50 border border-slate-100 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28" role="img" aria-label="Request volume chart">
          <defs>
            <linearGradient id="adminVolumeFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#27439C" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#27439C" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 1, 2].map(row => (
            <line
              key={row}
              x1="0"
              x2={width}
              y1={18 + row * 24}
              y2={18 + row * 24}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          ))}

          <path d={areaPath} fill="url(#adminVolumeFill)" />
          <path d={linePath} fill="none" stroke="#27439C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {coordinates.map(point => (
            <circle key={point.key} cx={point.x} cy={point.y} r="3.5" fill="#27439C" stroke="#FFFFFF" strokeWidth="2" />
          ))}
        </svg>

        <div className="flex justify-between text-[9px] text-slate-400 font-black px-1">
          <span>{points[0]?.label}</span>
          <span>{points[Math.floor(points.length / 2)]?.label}</span>
          <span>{points[points.length - 1]?.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[18px] bg-blue-50 border border-blue-100 p-3">
          <div className="text-[9px] uppercase font-black text-blue-600">{t('average') || 'Average'}</div>
          <div className="text-lg font-black text-slate-950 mt-1">{average}</div>
        </div>
        <div className="rounded-[18px] bg-green-50 border border-green-100 p-3">
          <div className="text-[9px] uppercase font-black text-green-700">{t('completed') || 'Completed'}</div>
          <div className="text-lg font-black text-slate-950 mt-1">{orders.filter(order => order.status === 'COMPLETED').length}</div>
        </div>
      </div>
    </div>
  );
}

function AdminOrderCard({ order, user, updatingOrderId, changeOrderStatus, token, reload }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="w-full text-left flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={order.status} />
            <span className="inline-flex px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-black">
              {paymentStatusLabel(order.paymentStatus, t)}
            </span>
          </div>

          <div className="text-[11px] font-black text-blue-600">{order.orderNumber}</div>
          <div className="font-black text-slate-950 text-lg leading-tight mt-1">{order.offer.request.partName}</div>
          <div className="text-xs text-slate-500 font-bold mt-1">
            {order.offer.request.make} {order.offer.request.model} • {toDateInputValue(order.createdAt) || t('notAvailable')}
          </div>
          <div className="text-xs text-slate-500 font-bold mt-1">{t('supplier')}: {order.offer.supplier.name}</div>
        </div>

        <div className="text-right shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-black">
            {open ? '−' : '+'}
          </div>
          <div className="text-[10px] text-slate-400 font-black mt-2">{open ? t('hide') : t('details')}</div>
        </div>
      </button>

      {open && (
        <div className="space-y-3">
          <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-1 text-xs">
            <div className="text-[10px] uppercase font-black text-blue-600">{t('partDetails')}</div>
            <div className="text-slate-900 font-black">{order.offer.request.partName}</div>
            <div className="text-slate-500 font-semibold">{order.offer.request.origin} / {order.offer.request.make} / {order.offer.request.model} / {order.offer.request.year}</div>
            <div className="text-slate-500 font-semibold">{t('condition')}: {order.offer.condition === 'NEW' ? t('new') : t('used')}</div>
          </div>

          <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-1 text-xs">
            <div className="text-[10px] uppercase font-black text-blue-600">{t('customer')}</div>
            <div className="text-slate-500 font-semibold">{t('customerPhone')}: {order.offer.request.customerPhone || t('notAvailable')}</div>
            <div className="text-slate-500 font-semibold">{t('location')}: {order.offer.request.location || t('notAvailable')}</div>
          </div>

          <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-1 text-xs">
            <div className="text-[10px] uppercase font-black text-blue-600">{t('supplier')}</div>
            <div className="text-slate-900 font-black">{order.offer.supplier.name}</div>
            {user?.role === 'SUPER_ADMIN' && (
              <div className="grid grid-cols-1 gap-1 pt-1">
                <div className="text-slate-500 font-semibold">{t('supplier')}: {formatIQD(order.supplierPrice)}</div>
                <div className="text-slate-500 font-semibold">{t('customer')}: {formatIQD(order.customerPrice)}</div>
                <div className="text-slate-500 font-semibold">{t('revenue')}: {formatIQD(order.platformRevenue)}</div>
              </div>
            )}
          </div>

          <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-1 text-xs">
            <div className="text-[10px] uppercase font-black text-blue-600">{t('payment')}</div>
            <div className="text-slate-500 font-semibold">{t('payment')}: {paymentMethodLabel(order.paymentMethod, t)}</div>
            <div className="text-slate-500 font-semibold">{t('status')}: {paymentStatusLabel(order.paymentStatus, t)}</div>
          </div>

          <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-1 text-xs">
            <div className="text-[10px] uppercase font-black text-blue-600">{t('delivery')}</div>
            <div className="text-slate-500 font-semibold">{t('delivery')}: {formatIQD(order.deliveryFee)}</div>
            <div className="text-slate-500 font-semibold">{t('driver')}: {order.driverName || t('notAssigned')}</div>
            <div className="text-slate-500 font-semibold">{t('deliveryEta')}: {order.deliveryEta || t('pending')}</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'DELIVERING')} className="text-[11px] py-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 font-black disabled:opacity-40">{t('delivering')}</button>
            <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'COMPLETED')} className="text-[11px] py-2.5 rounded-2xl bg-green-50 text-green-700 border border-green-100 font-black disabled:opacity-40">{t('completed')}</button>
            <button disabled={updatingOrderId === order.id} onClick={() => changeOrderStatus(order.id, 'CANCELLED')} className="text-[11px] py-2.5 rounded-2xl bg-red-50 text-red-700 border border-red-100 font-black disabled:opacity-40">{t('cancel')}</button>
          </div>

          <OrderPaymentControls order={order} token={token} reload={reload} />
          <OrderDeliveryControls order={order} token={token} reload={reload} />
        </div>
      )}
    </div>
  );
}

export default function Admin({ tab, setTab }) {
  const { token, user } = useAuth();
  const { t, language } = useLanguage();
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

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 rounded-[28px] border border-red-100 p-5 shadow-sm text-sm font-bold text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-[28px] border border-slate-200 p-5 shadow-sm text-sm font-bold text-slate-500">
          {t('loadingDashboard')}
        </div>
      </div>
    );
  }

  if (user?.role === 'ADMIN' && user?.adminPermission === 'ORDERS_ONLY' && tab !== 'orders') {
    return <div className="p-4 text-slate-500">{t('ordersOnlyAdminAccess')}</div>;
  }

  if (tab === 'manage') {
    if (user?.role !== 'SUPER_ADMIN') return <div className="p-4 text-red-600 text-sm">{t('superAdminOnlyUsers')}</div>;

    return <div className="p-4 space-y-4">
      <h1 className="font-black text-xl text-slate-900">{t('adminUsers')}</h1>
      <SuperAdminEnroll token={token} />
    </div>;
  }

  if (tab === 'audit') {
    return <div className="p-4 space-y-4">
      <h1 className="font-black text-xl text-slate-900">{t('auditLogs')}</h1>
      <AuditLogViewer token={token} />
    </div>;
  }

  if (tab === 'more') {
    const moreItems = [
      {
        id: 'audit',
        title: t('auditLogs'),
        subtitle: t('audit'),
        icon: 'AUD',
        onClick: () => setTab('audit')
      },
      ...(user?.role === 'SUPER_ADMIN' ? [{
        id: 'manage',
        title: t('adminUsers'),
        subtitle: t('users'),
        icon: 'USR',
        onClick: () => setTab('manage')
      }] : [])
    ];

    return <div className="p-4 space-y-4 pb-6">
      <div className="rounded-[30px] bg-white border border-slate-200 p-5 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
          {t('more')}
        </div>
        <h1 className="font-black text-2xl text-slate-950 mt-3">{t('more')}</h1>
        <div className="text-xs font-semibold text-slate-500 mt-1">{t('adminDashboard')}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {moreItems.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm text-left min-h-32 flex flex-col justify-between"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-xs font-black">
              {item.icon}
            </div>
            <div>
              <div className="font-black text-slate-950 leading-tight">{item.title}</div>
              <div className="text-xs text-slate-500 font-semibold mt-1">{item.subtitle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>;
  }

  if (tab === 'suppliers') {
    return <div className="p-4 space-y-4 pb-6">
      <div className="rounded-[30px] bg-white border border-slate-200 p-5 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
          {t('suppliers')}
        </div>
        <h1 className="font-black text-2xl text-slate-950 mt-3">{t('suppliers')}</h1>
        <div className="text-xs font-semibold text-slate-500 mt-1">
          {data.suppliers.length} {t('suppliers')}
        </div>
      </div>

      <div className="bg-white rounded-[30px] border border-slate-200 p-4 space-y-4 shadow-sm">
        <div>
          <div className="font-black text-slate-950">{t('addSupplier')}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">{t('addSupplierHint')}</div>
        </div>

        <div className="rounded-[24px] bg-slate-50 border border-slate-100 p-3 space-y-2">
          <div className="text-[10px] uppercase font-black text-blue-600">{t('supplierDetails')}</div>
          <input className="w-full p-3 rounded-2xl border bg-white text-sm font-bold" placeholder={t('supplierName')} value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          <input className="w-full p-3 rounded-2xl border bg-white text-sm font-bold" placeholder={t('phone')} value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
          <input className="w-full p-3 rounded-2xl border bg-white text-sm font-bold" placeholder={t('location')} value={supplierForm.location} onChange={e => setSupplierForm({ ...supplierForm, location: e.target.value })} />
        </div>

        <div className="rounded-[24px] bg-slate-50 border border-slate-100 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase font-black text-blue-600">{t('supportedMakes')}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-1">{t('supportedMakesHint')}</div>
            </div>
            <div className="text-[10px] font-black text-slate-500">
              {supplierForm.supportedMakes.length} / {Object.keys(carData).length}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.keys(carData).map(origin => {
              const selected = supplierForm.supportedMakes.includes(origin);
              const isDarkMode = localStorage.getItem('theme') === 'dark';
              const originStyle = isDarkMode
                ? {
                    backgroundColor: selected ? '#1A2549' : '#101A33',
                    borderColor: selected ? '#60A5FA' : '#334155',
                    color: selected ? '#DBEAFE' : '#E2E8F0'
                  }
                : {
                    backgroundColor: selected ? '#EEF4FF' : '#FFFFFF',
                    borderColor: selected ? '#93C5FD' : '#E2E8F0',
                    color: selected ? '#1D4ED8' : '#475569'
                  };

              return (
                <label
                  key={origin}
                  style={originStyle}
                  className="text-xs rounded-2xl p-3 flex gap-2 items-center border transition font-black"
                >
                  <input type="checkbox" checked={selected} onChange={e => setSupplierForm(current => ({
                    ...current,
                    supportedMakes: e.target.checked ? [...current.supportedMakes, origin] : current.supportedMakes.filter(item => item !== origin)
                  }))} />
                  <span>{origin}</span>
                </label>
              );
            })}
          </div>
        </div>

        <button onClick={addSupplier} disabled={!supplierForm.name || !supplierForm.phone || !supplierForm.location} className="w-full py-3.5 rounded-2xl bg-[#27439C] text-white font-black disabled:opacity-40 shadow-sm">
          {t('addSupplier')}
        </button>
      </div>

      <AdminSupplierList suppliers={data.suppliers} token={token} reload={load} />
    </div>;
  }


  if (tab === 'settlements') {
    return <div className="p-4 space-y-4">
      <h1 className="font-black text-xl text-slate-900">{t('supplierSettlements')}</h1>
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

    const statusFilters = [
      ['ALL', t('all')],
      ['OPEN', t('activeOrders')],
      ['COMPLETED', t('completed')],
      ['CANCELLED', t('cancelled')]
    ];

    return <div className="p-4 space-y-4 pb-6">
      <div className="rounded-[30px] bg-white border border-slate-200 p-5 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
          {t('orders')}
        </div>
        <h1 className="font-black text-2xl text-slate-950 mt-3">{t('allOrders')}</h1>
        <div className="text-xs font-semibold text-slate-500 mt-1">
          {t('showing')} {filteredOrders.length} {t('of')} {data.orders.length} {t('orders').toLowerCase()}
        </div>
      </div>

      {user?.role === 'SUPER_ADMIN' && <RequestVolumeChart orders={data.orders} t={t} language={language} />}

      <div className="grid grid-cols-2 gap-2 bg-white rounded-[24px] border border-slate-200 p-2 shadow-sm">
        {statusFilters.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatusFilter(id)}
            className={`min-h-[44px] px-3 py-2.5 rounded-[16px] text-[11px] leading-tight font-black text-center transition ${
              statusFilter === id ? 'bg-[#27439C] text-white shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[24px] border border-slate-200 p-3 space-y-2 shadow-sm">
        <input className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold" placeholder={t('searchOrderPartSupplier')} value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />

        <select className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">{t('allStatuses')}</option>
          <option value="OPEN">{t('activeOrders')}</option>
          <option value="WAITING_PICKUP">{t('waitingPickup')}</option>
          <option value="DELIVERING">{t('delivering')}</option>
          <option value="COMPLETED">{t('completed')}</option>
          <option value="CANCELLED">{t('cancelled')}</option>
        </select>

        <select className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold" value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)}>
          <option value="ALL">{t('allPayments')}</option>
          <option value="PENDING">{t('pending')}</option>
          <option value="PAID">{t('paid')}</option>
          <option value="FAILED">{t('failed')}</option>
          <option value="REFUNDED">{t('refunded')}</option>
        </select>

        <div className="grid grid-cols-1 gap-2">
          <label className="text-[10px] font-black text-slate-500 space-y-1">
            {t('from')}
            <input type="date" className="w-full min-w-0 p-3 rounded-2xl border bg-slate-50 text-sm font-bold" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </label>
          <label className="text-[10px] font-black text-slate-500 space-y-1">
            {t('to')}
            <input type="date" className="w-full min-w-0 p-3 rounded-2xl border bg-slate-50 text-sm font-bold" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </label>
        </div>

        {(orderSearch || statusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || dateFrom || dateTo) && (
          <button onClick={() => { setOrderSearch(''); setStatusFilter('ALL'); setPaymentStatusFilter('ALL'); setDateFrom(''); setDateTo(''); }} className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 text-xs font-black">
            {t('clearFilters')}
          </button>
        )}
      </div>

      {filteredOrders.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-[28px] p-6 text-center text-sm font-bold text-slate-400">
          {t('noMatchingOrders')}
        </div>
      )}

      {filteredOrders.map(order => <AdminOrderCard key={order.id} order={order} user={user} updatingOrderId={updatingOrderId} changeOrderStatus={changeOrderStatus} token={token} reload={load} />)}
    </div>;
  }

  return <div className="p-4 space-y-4 pb-6">
    <div className="rounded-[30px] bg-[#27439C] text-white p-5 shadow-sm overflow-hidden relative">
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute right-8 bottom-4 w-16 h-16 rounded-full bg-orange-400/10 pointer-events-none" />

      <div className="relative">
        <div className="text-xs font-bold text-white/70">{t('platformOverview')}</div>
        <div className="text-2xl font-black leading-tight mt-1">{t('adminDashboard')}</div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="rounded-2xl bg-white/12 border border-white/10 p-3 min-h-[82px] flex flex-col justify-between">
            <div className="text-[9px] leading-tight font-black uppercase text-white/65">{t('orders')}</div>
            <div className="text-2xl leading-none font-black tabular-nums">{data.summary.totalOrders}</div>
          </div>
          <div className="rounded-2xl bg-white/12 border border-white/10 p-3 min-h-[82px] flex flex-col justify-between">
            <div className="text-[9px] leading-tight font-black uppercase text-white/65">{t('suppliers')}</div>
            <div className="text-2xl leading-none font-black tabular-nums">{data.summary.suppliers}</div>
          </div>
          <div className="rounded-2xl bg-white/12 border border-white/10 p-3 min-h-[82px] flex flex-col justify-between">
            <div className="text-[9px] leading-tight font-black uppercase text-white/65">{t('completed')}</div>
            <div className="text-2xl leading-none font-black tabular-nums">{data.summary.completedOrders ?? 0}</div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <StatCard label={t('activeOrders')} value={data.summary.activeOrders ?? data.summary.totalOrders} tone="blue" />
      <StatCard label={t('waitingPickup')} value={data.summary.waitingPickupOrders ?? 0} tone="amber" />
      <StatCard label={t('delivering')} value={data.summary.deliveringOrders ?? 0} tone="blue" />
      <StatCard label={t('completed')} value={data.summary.completedOrders ?? 0} tone="green" />
      <StatCard label={t('cancelled')} value={data.summary.cancelledOrders ?? 0} tone="red" />
      <StatCard label={t('pendingPayments')} value={data.summary.pendingPayments ?? 0} tone="amber" />
      <StatCard label={t('paidOrders')} value={data.summary.paidOrders ?? 0} tone="green" />
      <StatCard label={t('activeSuppliers')} value={data.summary.activeSuppliers ?? data.summary.suppliers} tone="blue" />
      {user?.role === 'SUPER_ADMIN' && (
        <StatCard label={t('platformRevenue')} value={formatIQD(data.summary.platformRevenue)} tone="blue" />
      )}
    </div>

    <div className="rounded-[30px] bg-white border border-slate-200 p-5 shadow-sm">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
        {t('suppliers')}
      </div>
      <h2 className="font-black text-2xl text-slate-950 mt-3">{t('suppliers')}</h2>
      <div className="text-xs font-semibold text-slate-500 mt-1">{t('activeSuppliers')}: {data.summary.activeSuppliers ?? data.summary.suppliers}</div>
    </div>

    <AdminSupplierList suppliers={data.suppliers.slice(0, 3)} token={token} reload={load} />
  </div>;
}
