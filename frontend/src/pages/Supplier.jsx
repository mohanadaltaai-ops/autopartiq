import React, { useEffect, useMemo, useState } from 'react';
import { api, formatIQD, uploadImage } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  return (
    <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-6 text-center shadow-sm">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black mb-3">
        —
      </div>
      <div className="text-sm font-bold text-slate-500">{text}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{label}</span><strong className="text-slate-700 text-right">{value || 'N/A'}</strong></div>;
}

function conditionLabel(condition, t) {
  if (condition === 'NEW') return t('new');
  if (condition === 'USED') return t('used');
  return condition;
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

function offerStatusLabel(status, t) {
  if (status === 'ACTIVE') return t('pending');
  if (status === 'REJECTED') return t('rejected') || 'Rejected';
  if (status === 'CANCELLED') return t('cancelled');
  if (status === 'ACCEPTED') return t('accepted') || 'Accepted';
  return status;
}

export default function Supplier({ tab }) {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [leads, setLeads] = useState([]);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [payoutSummary, setPayoutSummary] = useState(null);
  const [homeTab, setHomeTab] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  async function load() {
    try {
      setError('');
      const [l, o, sent, payoutResult, payoutSummaryResult] = await Promise.all([
        api('/requests/supplier/leads', { token }),
        api('/orders/mine', { token }),
        api('/offers/mine', { token }),
        api('/payouts/supplier', { token }),
        api('/payouts/supplier/summary', { token })
      ]);
      setLeads(l.requests || []);
      setOrders(o.orders || []);
      setOffers(sent.offers || []);
      setPayouts(payoutResult.payouts || []);
      setPayoutSummary(payoutSummaryResult.summary || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  const activeOfferCountByRequest = useMemo(() => offers.reduce((map, offer) => {
    if (!['CANCELLED', 'ACCEPTED'].includes(offer.status)) map[offer.requestId] = (map[offer.requestId] || 0) + 1;
    return map;
  }, {}), [offers]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-[28px] border border-slate-200 p-5 shadow-sm text-sm font-bold text-slate-500">
          {t('loadingSupplier')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 rounded-[28px] border border-red-100 p-5 shadow-sm text-sm font-bold text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (tab === 'orders') {
    return <div className="p-4 space-y-4 pb-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="rounded-[30px] bg-white border border-slate-200 p-5 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
          {t('orders')}
        </div>
        <h1 className="font-black text-2xl text-slate-950 mt-3">{t('activeOrders')}</h1>
        <div className="text-xs font-semibold text-slate-500 mt-1">
          {orders.length === 0 ? t('noAcceptedOrders') : `${orders.length} ${t('orders')}`}
        </div>
      </div>

      {orders.length === 0 && <Empty text={t('noAcceptedOrders')} />}
      {orders.map(o => <OrderCard key={o.id} order={o} />)}
    </div>;
  }

  if (tab === 'earnings') return <Earnings orders={orders} payouts={payouts} payoutSummary={payoutSummary} />;

  return <div className="p-4 space-y-4 pb-6">
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

    <div className="rounded-[30px] bg-[#27439C] text-white p-5 shadow-sm overflow-hidden relative">
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute right-8 bottom-4 w-16 h-16 rounded-full bg-orange-400/20" />

      <div className="relative">
        <div className="text-xs font-bold text-white/70">{t('supplierWorkspace')}</div>
        <div className="text-2xl font-black leading-tight mt-1">{t('offersLeads')}</div>
        <div className="text-xs font-semibold text-white/70 mt-2 max-w-[260px]">{t('availableRequests')}</div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-2xl bg-white/12 border border-white/10 p-3">
            <div className="text-[10px] font-black uppercase text-white/60">{t('leads')}</div>
            <div className="text-2xl font-black mt-1">{leads.length}</div>
          </div>
          <div className="rounded-2xl bg-white/12 border border-white/10 p-3">
            <div className="text-[10px] font-black uppercase text-white/60">{t('sentOffers')}</div>
            <div className="text-2xl font-black mt-1">{offers.length}</div>
          </div>
          <div className="rounded-2xl bg-white/12 border border-white/10 p-3">
            <div className="text-[10px] font-black uppercase text-white/60">{t('orders')}</div>
            <div className="text-2xl font-black mt-1">{orders.length}</div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 bg-white rounded-[24px] border border-slate-200 p-2 shadow-sm">
      <button onClick={() => setHomeTab('leads')} className={`py-3 rounded-[18px] text-sm font-black transition ${homeTab === 'leads' ? 'bg-[#27439C] text-white shadow-sm' : 'text-slate-500'}`}>
        {t('leads')}
      </button>
      <button onClick={() => setHomeTab('sent')} className={`py-3 rounded-[18px] text-sm font-black transition ${homeTab === 'sent' ? 'bg-[#27439C] text-white shadow-sm' : 'text-slate-500'}`}>
        {t('sentOffers')}
      </button>
    </div>

    {homeTab === 'leads'
      ? <>
          {leads.length === 0 && <Empty text={t('noMatchingLeads')} />}
          {leads.map(req => (
            <Lead
              key={req.id}
              req={req}
              token={token}
              reload={load}
              onSubmitted={() => setHomeTab('sent')}
              existingCount={activeOfferCountByRequest[req.id] || 0}
              onToast={setToast}
            />
          ))}
        </>
      : <SentOffers offers={offers} token={token} reload={load} onToast={setToast} />}
  </div>;
}

function OrderCard({ order }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const statusTone = order.status === 'COMPLETED'
    ? 'bg-green-50 text-green-700 border-green-100'
    : order.status === 'CANCELLED'
      ? 'bg-red-50 text-red-700 border-red-100'
      : 'bg-blue-50 text-blue-700 border-blue-100';

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="w-full text-left flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <div className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black mb-2 ${statusTone}`}>
            {orderStatusLabel(order.status, t)}
          </div>

          <div className="font-black text-slate-950 text-lg leading-tight">{order.offer.request.partName}</div>
          <div className="text-xs text-slate-500 font-bold mt-1">
            {order.offer.request.make} {order.offer.request.model} • {conditionLabel(order.offer.condition, t)}
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">{t('yourPrice')}</span>
            <span className="text-sm font-black text-blue-700">{formatIQD(order.supplierPrice)}</span>
          </div>
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
          <OrderInfoPanel order={order} />
          <DeliveryWorkflow status={order.status} />
          <div className="rounded-[20px] bg-slate-50 border border-slate-100 text-slate-500 text-xs p-3 font-bold">
            {t('orderReadOnly')}
          </div>
        </div>
      )}
    </div>
  );
}

function payoutStatusClass(status) {
  if (status === 'PAID') return 'bg-green-50 text-green-700 border-green-100';
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
}

function Earnings({ orders, payouts = [], payoutSummary }) {
  const { t } = useLanguage();
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const openOrders = orders.filter(o => ['WAITING_PICKUP', 'DELIVERING'].includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

  const totalCompleted = completedOrders.reduce((sum, order) => sum + Number(order.supplierPrice || 0), 0);
  const pendingValue = openOrders.reduce((sum, order) => sum + Number(order.supplierPrice || 0), 0);

  const recentCompleted = [...completedOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentOpen = [...openOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentPayouts = [...payouts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pendingPayoutAmount = payoutSummary?.pendingAmount || 0;
  const paidPayoutAmount = payoutSummary?.paidAmount || 0;
  const cancelledPayoutAmount = payoutSummary?.cancelledAmount || 0;

  const Stat = ({ label, value, tone = 'blue' }) => {
    const toneClass = tone === 'green'
      ? 'text-green-700 bg-green-50 border-green-100'
      : tone === 'red'
        ? 'text-red-700 bg-red-50 border-red-100'
        : tone === 'amber'
          ? 'text-amber-700 bg-amber-50 border-amber-100'
          : 'text-blue-700 bg-blue-50 border-blue-100';

    return (
      <div className="bg-white rounded-[24px] border border-slate-200 p-4 shadow-sm">
        <div className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black uppercase ${toneClass}`}>
          {label}
        </div>
        <div className="mt-3 text-xl leading-tight font-black tabular-nums text-slate-950">{value}</div>
      </div>
    );
  };

  const TransactionCard = ({ order, type }) => (
    <div className="bg-white rounded-[24px] border border-slate-200 p-4 shadow-sm flex justify-between gap-3">
      <div className="min-w-0">
        <div className="font-black text-slate-950 leading-tight">{order.offer.request.partName}</div>
        <div className="text-xs text-slate-500 font-bold mt-1">
          {order.orderNumber} • {type === 'completed' ? t('completed') : orderStatusLabel(order.status, t)}
        </div>
      </div>
      <div className={`font-black shrink-0 ${type === 'completed' ? 'text-green-700' : 'text-blue-700'}`}>
        {formatIQD(order.supplierPrice)}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="rounded-[30px] bg-[#27439C] text-white p-5 shadow-sm overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute right-8 bottom-4 w-16 h-16 rounded-full bg-orange-400/20" />

        <div className="relative">
          <div className="text-xs font-bold text-white/70">{t('completedEarningsOnly')}</div>
          <div className="text-3xl font-black mt-2">{formatIQD(totalCompleted)}</div>
          <div className="text-[11px] text-white/70 font-semibold mt-2">{t('pendingValue')}: {formatIQD(pendingValue)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('completedOrders')} value={completedOrders.length} tone="green" />
        <Stat label={t('openOrders')} value={openOrders.length} tone="blue" />
        <Stat label={t('cancelled')} value={cancelledOrders.length} tone="red" />
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm">
        <div className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase">
          {t('pendingValue')}
        </div>
        <div className="text-2xl font-black text-slate-950 mt-3">{formatIQD(pendingValue)}</div>
        <div className="text-xs text-slate-500 font-semibold mt-1">{t('pendingValueNote')}</div>
      </div>

      <div>
        <h2 className="font-black text-slate-950 mb-3">{t('supplierPayouts') || 'Supplier Payouts'}</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t('pendingPayout') || 'Pending Payout'} value={formatIQD(pendingPayoutAmount)} tone="amber" />
          <Stat label={t('paidPayout') || 'Paid Payout'} value={formatIQD(paidPayoutAmount)} tone="green" />
          <Stat label={t('cancelledPayout') || 'Cancelled Payout'} value={formatIQD(cancelledPayoutAmount)} tone="red" />
        </div>
      </div>

      <div>
        <h2 className="font-black text-slate-950 mb-3">{t('payoutHistory') || 'Payout History'}</h2>
        {recentPayouts.length === 0 && <Empty text={t('noSupplierPayouts') || 'No supplier payouts yet.'} />}

        <div className="space-y-3">
          {recentPayouts.map(payout => (
            <div key={payout.id} className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-black text-slate-950 leading-tight">{payout.order?.offer?.request?.partName || '-'}</div>
                  <div className="text-xs text-slate-500 font-bold mt-1">{payout.order?.orderNumber || payout.metadata?.orderNumber || '-'}</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">{new Date(payout.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-slate-950">{formatIQD(payout.amount)}</div>
                  <div className={`inline-flex mt-1 px-2.5 py-1 rounded-full border text-[10px] font-black ${payoutStatusClass(payout.status)}`}>
                    {payout.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3">
                  <div className="text-[10px] uppercase font-black text-slate-400">{t('payoutMethod') || 'Method'}</div>
                  <div className="font-bold text-slate-700 mt-1">{payout.method || 'MANUAL'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3">
                  <div className="text-[10px] uppercase font-black text-slate-400">{t('payoutReference') || 'Reference'}</div>
                  <div className="font-bold text-slate-700 break-all mt-1">{payout.reference || '-'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3 col-span-2">
                  <div className="text-[10px] uppercase font-black text-slate-400">{t('paidAt') || 'Paid At'}</div>
                  <div className="font-bold text-slate-700 mt-1">{payout.paidAt ? new Date(payout.paidAt).toLocaleString() : '-'}</div>
                </div>
              </div>

              {payout.notes && (
                <div className="text-xs bg-slate-50 border border-slate-100 text-slate-600 rounded-[18px] p-3 font-semibold leading-relaxed">
                  {payout.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-black text-slate-950 mb-3">{t('openTransactions')}</h2>
        {recentOpen.length === 0 && <Empty text={t('noPendingValue')} />}
        <div className="space-y-3">
          {recentOpen.map(o => <TransactionCard key={o.id} order={o} type="open" />)}
        </div>
      </div>

      <div>
        <h2 className="font-black text-slate-950 mb-3">{t('completedTransactions')}</h2>
        {recentCompleted.length === 0 && <Empty text={t('noCompletedEarnings')} />}
        <div className="space-y-3">
          {recentCompleted.map(o => <TransactionCard key={o.id} order={o} type="completed" />)}
        </div>
      </div>
    </div>
  );
}


function SentOffers({ offers, token, reload, onToast }) {
  const { t } = useLanguage();
  const [cancelReasonById, setCancelReasonById] = useState({});
  const [openCancelId, setOpenCancelId] = useState('');
  const [openId, setOpenId] = useState('');
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const visibleSentOffers = offers.filter(offer => offer.status !== 'ACCEPTED');
  const activeOffersCount = visibleSentOffers.filter(offer => offer.status === 'ACTIVE').length;
  const rejectedOffersCount = visibleSentOffers.filter(offer => offer.status === 'REJECTED').length;
  const cancelledOffersCount = visibleSentOffers.filter(offer => offer.status === 'CANCELLED').length;

  const visibleOffers = visibleSentOffers
    .filter(offer => offer.status !== 'ACCEPTED')
    .filter(offer => statusFilter === 'ALL' || offer.status === statusFilter);

  async function cancelOffer(offerId) {
    try {
      setError('');
      await api(`/offers/${offerId}/cancel`, { method: 'PATCH', token, body: { reason: cancelReasonById[offerId] || '' } });
      setOpenCancelId('');
      onToast?.({ message: t('offerCancelled'), type: 'success' });
      await reload();
    } catch (e) {
      setError(e.message);
      onToast?.({ message: e.message, type: 'error' });
    }
  }

  function statusClass(status) {
    if (status === 'REJECTED') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-100';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  }

  const filters = [
    ['ACTIVE', t('active')],
    ['REJECTED', t('rejected')],
    ['CANCELLED', t('cancelled')],
    ['ALL', t('all')]
  ];

  return (
    <div className="space-y-4">
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3 font-bold">{error}</div>}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-[24px] border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-black uppercase">{t('activeOffers')}</div>
          <div className="mt-2 text-2xl leading-none font-black tabular-nums text-blue-700">{activeOffersCount}</div>
        </div>
        <div className="bg-white rounded-[24px] border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-black uppercase">{t('rejected')}</div>
          <div className="mt-2 text-2xl leading-none font-black tabular-nums text-slate-700">{rejectedOffersCount}</div>
        </div>
        <div className="bg-white rounded-[24px] border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-black uppercase">{t('cancelled')}</div>
          <div className="mt-2 text-2xl leading-none font-black tabular-nums text-red-700">{cancelledOffersCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-white rounded-[24px] border border-slate-200 p-2 shadow-sm">
        {filters.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatusFilter(id)}
            className={`py-2.5 rounded-[16px] text-[11px] font-black transition ${
              statusFilter === id ? 'bg-[#27439C] text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleOffers.length === 0 && <Empty text={t('noMatchingSentOffers')} />}

      {visibleOffers.map(offer => {
        const photos = parseJsonArray(offer.photoUrlsJson);
        const canCancel = offer.status === 'ACTIVE';
        const open = openId === offer.id;

        return (
          <div key={offer.id} className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
            <button type="button" onClick={() => setOpenId(open ? '' : offer.id)} className="w-full text-left flex justify-between gap-3">
              <div className="min-w-0">
                <div className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black mb-2 ${statusClass(offer.status)}`}>
                  {offerStatusLabel(offer.status, t)}
                </div>

                <div className="font-black text-slate-950 text-lg leading-tight">{offer.request?.partName}</div>
                <div className="text-xs text-slate-500 font-bold mt-1">
                  {offer.request?.make} {offer.request?.model} • {conditionLabel(offer.condition, t)}
                </div>
                <div className="text-sm font-black text-blue-600 mt-2">{formatIQD(offer.supplierPrice)}</div>
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
                <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-1">
                  <div className="text-[10px] uppercase font-black text-blue-600">{t('requestDetails')}</div>
                  <SummaryRow label={t('part')} value={offer.request?.partName || '-'} />
                  <SummaryRow label={t('make')} value={`${offer.request?.make || '-'} ${offer.request?.model || ''}`.trim()} />
                  <SummaryRow label={t('year')} value={offer.request?.year || '-'} />
                </div>

                <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-1">
                  <div className="text-[10px] uppercase font-black text-blue-600">{t('offerDetails')}</div>
                  <SummaryRow label={t('yourPrice')} value={formatIQD(offer.supplierPrice)} />
                  <SummaryRow label={t('condition')} value={conditionLabel(offer.condition, t)} />
                  <SummaryRow label={t('status')} value={offerStatusLabel(offer.status, t)} />
                </div>

                {offer.notes && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-[18px] p-3 font-semibold leading-relaxed">
                    {offer.notes}
                  </div>
                )}

                {offer.cancellationReason && (
                  <div className="text-xs bg-red-50 border border-red-100 text-red-700 rounded-[18px] p-3 font-bold">
                    {t('reasonForCancellation')}: {offer.cancellationReason}
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map(url => (
                      <ImagePreview key={url} src={url} alt="Offer" className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
                    ))}
                  </div>
                )}

                {canCancel && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    {openCancelId !== offer.id ? (
                      <button type="button" onClick={() => setOpenCancelId(offer.id)} className="text-xs font-black text-red-600">
                        {t('cancelSentOffer')}
                      </button>
                    ) : (
                      <>
                        <textarea
                          className="w-full p-3 rounded-2xl border text-sm"
                          placeholder={t('reasonForCancellation')}
                          value={cancelReasonById[offer.id] || ''}
                          onChange={e => setCancelReasonById(current => ({ ...current, [offer.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => cancelOffer(offer.id)}
                          disabled={!cancelReasonById[offer.id]?.trim()}
                          className="w-full py-3 rounded-2xl bg-red-600 text-white text-sm font-black disabled:opacity-40"
                        >
                          {t('confirmCancellation')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Lead({ req, token, reload, onSubmitted, existingCount, onToast }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ supplierPrice: '', condition: 'NEW', notes: '', photoUrls: [] });
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const requestPhotos = parseJsonArray(req.photoUrlsJson);

  function resetDraft() {
    setDraft({ supplierPrice: '', condition: 'NEW', notes: '', photoUrls: [] });
    setEditIndex(null);
  }

  async function handleOfferPhotoUpload(file) {
    if (!file) return;
    if (draft.photoUrls.length >= 5) return setError(t('upload5'));
    setUploading(true);
    setError('');
    try {
      const result = await uploadImage(file, { token, context: 'offer' });
      setDraft(current => ({ ...current, photoUrls: [...current.photoUrls, result.url].slice(0, 5) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(index) {
    setDraft(current => ({ ...current, photoUrls: current.photoUrls.filter((_, photoIndex) => photoIndex !== index) }));
  }

  function addOrUpdateItem() {
    setError('');
    const supplierPrice = Number(draft.supplierPrice);
    if (!Number.isFinite(supplierPrice) || supplierPrice <= 0) return setError(t('validSupplierPrice'));

    const item = { supplierPrice, condition: draft.condition, notes: draft.notes.trim(), photoUrls: draft.photoUrls };
    setItems(current => editIndex === null ? [...current, item] : current.map((existing, index) => index === editIndex ? item : existing));
    resetDraft();
  }

  function editItem(index) {
    const item = items[index];
    setDraft({ supplierPrice: String(item.supplierPrice), condition: item.condition, notes: item.notes || '', photoUrls: item.photoUrls || [] });
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
      if (!items.length) return setError(t('addAtLeastOneItem'));
      for (const item of items) {
        await api(`/offers/request/${req.id}`, { method: 'POST', token, body: item });
      }
      setItems([]);
      resetDraft();
      onToast?.({ message: t('offerItemsSubmitted'), type: 'success' });
      await reload();
      onSubmitted?.();
    } catch (e) {
      setError(e.message);
      onToast?.({ message: e.message, type: 'error' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-4 space-y-3 shadow-sm">
      <button type="button" onClick={() => setOpen(value => !value)} className="w-full text-left flex justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black mb-2">
            {existingCount ? `${existingCount} ${t('sentOffers')}` : t('open')}
          </div>
          <div className="font-black text-slate-950 text-lg leading-tight">{req.partName}</div>
          <div className="text-xs text-slate-500 font-bold mt-1">{req.make} {req.model} ({req.year})</div>
          <div className="text-[11px] text-slate-400 font-bold mt-2">{req.origin}</div>
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
          <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-1">
            <div className="text-[10px] uppercase font-black text-blue-600">{t('requestDetails')}</div>
            <SummaryRow label={t('origin')} value={req.origin} />
            <SummaryRow label={t('make')} value={req.make} />
            <SummaryRow label={t('model')} value={req.model} />
            <SummaryRow label={t('year')} value={req.year} />
            <SummaryRow label={t('partName')} value={req.partName} />
            {req.partNumber && <SummaryRow label={t('partNumber')} value={req.partNumber} />}
            {req.vin && <SummaryRow label={t('vinChassis')} value={req.vin} />}
          </div>

          {req.description && (
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-[18px] p-3 font-semibold leading-relaxed">
              {req.description}
            </p>
          )}

          {requestPhotos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {requestPhotos.map(url => (
                <ImagePreview key={url} src={url} alt="Request" className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
              ))}
            </div>
          )}

          <div className="rounded-[24px] bg-blue-50 border border-blue-100 p-4 space-y-3">
            <div>
              <div className="text-[10px] uppercase font-black text-blue-600">{t('addOfferItem')}</div>
              <div className="text-xs text-slate-500 font-semibold mt-1">{t('submitOfferItems')}</div>
            </div>

            <input
              className="w-full p-3 rounded-2xl border bg-white font-bold"
              placeholder={t('netPriceIqd')}
              value={draft.supplierPrice}
              onChange={e => setDraft(current => ({ ...current, supplierPrice: e.target.value }))}
              inputMode="numeric"
            />

            <select
              className="w-full p-3 rounded-2xl border bg-white font-bold"
              value={draft.condition}
              onChange={e => setDraft(current => ({ ...current, condition: e.target.value }))}
            >
              <option value="NEW">{t('new')}</option>
              <option value="USED">{t('used')}</option>
            </select>

            <label className="block w-full py-3 rounded-2xl bg-[#27439C] text-white text-center text-sm font-black cursor-pointer">
              {uploading ? t('uploading') : t('uploadOfferPhoto')}
              <input type="file" accept="image/*" className="hidden" disabled={uploading || draft.photoUrls.length >= 5} onChange={e => handleOfferPhotoUpload(e.target.files?.[0])} />
            </label>

            <div className="text-[10px] text-slate-500 font-semibold">{t('imageHelp')}</div>

            {draft.photoUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {draft.photoUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative">
                    <ImagePreview src={url} alt="Offer preview" className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
                    <button onClick={() => removePhoto(index)} type="button" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-black whitespace-nowrap inline-flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}

            <input
              className="w-full p-3 rounded-2xl border bg-white font-bold"
              placeholder={t('notes')}
              value={draft.notes}
              onChange={e => setDraft(current => ({ ...current, notes: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={addOrUpdateItem} className="py-3 rounded-2xl bg-[#27439C] text-white font-black">
                {editIndex === null ? t('addItem') : t('updateItem')}
              </button>
              <button type="button" onClick={resetDraft} className="py-3 rounded-2xl bg-white border text-slate-600 font-black">
                {t('clear')}
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-500">{t('itemsReady')}: {items.length}</div>
              {items.map((item, index) => (
                <div key={`${item.condition}-${item.supplierPrice}-${index}`} className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-black text-sm text-slate-900">{conditionLabel(item.condition, t)} • {formatIQD(item.supplierPrice)}</div>
                      {item.notes && <div className="text-xs text-slate-500 font-semibold mt-1">{item.notes}</div>}
                      <div className="text-[10px] text-slate-400 font-bold mt-1">{t('requestPhotosUpTo4')}: {item.photoUrls?.length || 0}</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editItem(index)} className="text-xs font-black text-blue-600">{t('edit')}</button>
                      <button type="button" onClick={() => removeItem(index)} className="text-xs font-black text-red-600">{t('remove')}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3 font-bold">{error}</div>}

          <button
            type="button"
            onClick={submitItems}
            disabled={!items.length || sending}
            className="w-full py-3 rounded-2xl bg-[#27439C] text-white font-black disabled:opacity-40 shadow-sm"
          >
            {sending ? t('uploading') : `${t('submitOfferItems')} ${items.length || ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
