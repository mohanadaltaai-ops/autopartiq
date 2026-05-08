import React, { useEffect, useMemo, useState } from 'react';
import { api, formatIQD } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

const METHODS = ['CASH', 'ZAINCASH', 'MANUAL', 'OTHER'];

function statusClass(status) {
  if (status === 'PAID') return 'bg-green-50 text-green-700 border-green-100';
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
}

function SummaryCard({ label, value, tone = 'blue' }) {
  const toneClass = tone === 'green'
    ? 'bg-green-50 text-green-700 border-green-100'
    : tone === 'red'
      ? 'bg-red-50 text-red-700 border-red-100'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-blue-50 text-blue-700 border-blue-100';

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 p-3 shadow-sm min-h-[104px] flex flex-col justify-between overflow-hidden">
      <div className={`self-start max-w-full px-2 py-1 rounded-full border text-[9px] leading-tight font-black uppercase break-words ${toneClass}`}>
        {label}
      </div>
      <div className="mt-2 text-[16px] leading-[1.05] font-black tabular-nums text-slate-950 break-words">
        {value}
      </div>
    </div>
  );
}

function PayoutCard({ payout, token, reload }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    method: 'MANUAL',
    reference: '',
    notes: ''
  });

  const orderNumber = payout.order?.orderNumber || payout.metadata?.orderNumber || '-';
  const supplierName = payout.supplier?.name || payout.supplier?.user?.name || '-';
  const partName = payout.order?.offer?.request?.partName || '-';

  async function markPaid() {
    setSaving(true);
    try {
      await api(`/payouts/admin/${payout.id}/mark-paid`, {
        method: 'PATCH',
        token,
        body: form
      });
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function cancelPayout() {
    const reason = window.prompt(t('cancellationReason'));
    if (reason === null) return;

    setSaving(true);
    try {
      await api(`/payouts/admin/${payout.id}/cancel`, {
        method: 'PATCH',
        token,
        body: { reason, notes: reason }
      });
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
      <button type="button" onClick={() => setOpen(value => !value)} className="w-full text-left flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black mb-2 ${statusClass(payout.status)}`}>
            {t(`payoutStatus${payout.status}`)}
          </div>
          <div className="font-black text-slate-950 text-lg leading-tight">{supplierName}</div>
          <div className="text-xs text-slate-500 font-bold mt-1">{orderNumber} • {partName}</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">{new Date(payout.createdAt).toLocaleString()}</div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-black text-slate-950 text-sm leading-tight">{formatIQD(payout.amount)}</div>
          <div className="w-10 h-10 mt-2 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-black ms-auto">
            {open ? '−' : '+'}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3">
              <div className="text-[10px] uppercase font-black text-blue-600">{t('payoutMethod')}</div>
              <div className="font-bold text-slate-700 mt-1">{payout.method || 'MANUAL'}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3">
              <div className="text-[10px] uppercase font-black text-blue-600">{t('payoutReference')}</div>
              <div className="font-bold text-slate-700 break-all mt-1">{payout.reference || '-'}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3">
              <div className="text-[10px] uppercase font-black text-blue-600">{t('paidAt')}</div>
              <div className="font-bold text-slate-700 mt-1">{payout.paidAt ? new Date(payout.paidAt).toLocaleString() : '-'}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3">
              <div className="text-[10px] uppercase font-black text-blue-600">{t('orderStatus')}</div>
              <div className="font-bold text-slate-700 mt-1">{payout.order?.status || '-'}</div>
            </div>
          </div>

          {payout.notes && (
            <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3 text-xs text-slate-600 font-semibold leading-relaxed">
              <div className="text-[10px] uppercase font-black text-blue-600 mb-1">{t('notes')}</div>
              {payout.notes}
            </div>
          )}

          {payout.status === 'PENDING' && (
            <div className="space-y-2 rounded-[20px] bg-slate-50 border border-slate-100 p-3">
              <select className="w-full p-3 rounded-2xl border bg-white text-sm font-bold" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                {METHODS.map(method => <option key={method} value={method}>{method}</option>)}
              </select>

              <input className="w-full p-3 rounded-2xl border bg-white text-sm font-bold" placeholder={t('payoutReferencePlaceholder')} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
              <textarea className="w-full p-3 rounded-2xl border bg-white text-sm font-bold" placeholder={t('notes')} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

              <div className="grid grid-cols-2 gap-2">
                <button disabled={saving} onClick={markPaid} className="py-3 rounded-2xl bg-green-600 text-white text-xs font-black disabled:opacity-40">
                  {t('markPaid')}
                </button>
                <button disabled={saving} onClick={cancelPayout} className="py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-black disabled:opacity-40">
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPayoutManager({ token, marketFilter = 'ALL' }) {
  const { t } = useLanguage();
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');

    try {
      const marketQuery = `?market=${marketFilter || 'ALL'}`;
      const [payoutResult, summaryResult] = await Promise.all([
        api(`/payouts/admin${marketQuery}`, { token }),
        api(`/payouts/admin/summary${marketQuery}`, { token })
      ]);

      setPayouts(payoutResult.payouts || []);
      setSummary(summaryResult.summary || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token, marketFilter]);

  const supplierOptions = useMemo(() => {
    const map = new Map();

    payouts.forEach(payout => {
      if (payout.supplierId) {
        map.set(payout.supplierId, payout.supplier?.name || payout.supplier?.user?.name || 'Supplier');
      }
    });

    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    const search = supplierSearch.trim().toLowerCase();

    return payouts.filter(payout => {
      const supplierName = (payout.supplier?.name || payout.supplier?.user?.name || '').toLowerCase();
      const orderNumber = (payout.order?.orderNumber || payout.metadata?.orderNumber || '').toLowerCase();
      const partName = (payout.order?.offer?.request?.partName || '').toLowerCase();

      const matchesStatus = statusFilter === 'ALL' || payout.status === statusFilter;
      const matchesSupplier = supplierFilter === 'ALL' || payout.supplierId === supplierFilter;
      const matchesSearch = !search || supplierName.includes(search) || orderNumber.includes(search) || partName.includes(search);

      return matchesStatus && matchesSupplier && matchesSearch;
    });
  }, [payouts, statusFilter, supplierFilter, supplierSearch]);

  if (loading) return <div className="bg-white rounded-[28px] border border-slate-200 p-5 text-sm font-bold text-slate-500 shadow-sm">{t('loadingSettlements')}</div>;
  if (error) return <div className="bg-red-50 rounded-[28px] border border-red-100 p-5 text-sm font-bold text-red-700 shadow-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label={t('pendingAmount')} value={formatIQD(summary?.pendingAmount || 0)} tone="amber" />
        <SummaryCard label={t('paidAmount')} value={formatIQD(summary?.paidAmount || 0)} tone="green" />
        <SummaryCard label={t('pendingCount')} value={summary?.pendingCount || 0} tone="amber" />
        <SummaryCard label={t('paidCount')} value={summary?.paidCount || 0} tone="green" />
      </div>

      <div className="grid grid-cols-2 gap-2 bg-white rounded-[24px] border border-slate-200 p-2 shadow-sm">
        {['ALL', 'PENDING', 'PAID', 'CANCELLED'].map(status => (
          <button
            key={t(`payoutFilter${status}`)}
            onClick={() => setStatusFilter(status)}
            className={`min-h-[44px] px-3 py-2.5 rounded-[16px] text-[11px] leading-tight font-black text-center transition ${
              statusFilter === status ? 'bg-[#27439C] text-white shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100'
            }`}
          >
            {t(`payoutFilter${status}`)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[24px] border border-slate-200 p-3 space-y-2 shadow-sm">
        <input
          className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold"
          placeholder={t('searchSupplierOrderPart')}
          value={supplierSearch}
          onChange={e => setSupplierSearch(e.target.value)}
        />

        <select className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="ALL">{t('allSuppliers')}</option>
          {supplierOptions.map(([supplierId, supplierName]) => (
            <option key={supplierId} value={supplierId}>{supplierName}</option>
          ))}
        </select>

        <div className="text-[10px] text-slate-400 font-black">
          {t('showingPayouts').replace('{shown}', filteredPayouts.length).replace('{total}', payouts.length)}
        </div>
      </div>

      {filteredPayouts.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-[28px] p-6 text-center text-sm font-bold text-slate-400">
          {t('noSupplierPayoutsFound')}
        </div>
      )}

      {filteredPayouts.map(payout => <PayoutCard key={payout.id} payout={payout} token={token} reload={load} />)}
    </div>
  );
}
