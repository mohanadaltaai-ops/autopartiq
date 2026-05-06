import React, { useEffect, useMemo, useState } from 'react';
import { api, formatIQD } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

const METHODS = ['CASH', 'ZAINCASH', 'MANUAL', 'OTHER'];

function statusClass(status) {
  if (status === 'PAID') return 'bg-green-50 text-green-700 border-green-100';
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
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

  return <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
    <button onClick={() => setOpen(value => !value)} className="w-full text-left flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-black text-slate-900">{supplierName}</div>
        <div className="text-xs text-slate-500">{orderNumber} • {partName}</div>
        <div className="text-[11px] text-slate-400 mt-1">{new Date(payout.createdAt).toLocaleString()}</div>
      </div>

      <div className="text-right shrink-0">
        <div className="font-black text-slate-900">{formatIQD(payout.amount)}</div>
        <div className={`inline-flex mt-1 px-2 py-1 rounded-full border text-[10px] font-black ${statusClass(payout.status)}`}>
          {t(`payoutStatus${payout.status}`)}
        </div>
      </div>
    </button>

    {open && <div className="border-t pt-3 space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] uppercase font-black text-slate-400">{t('payoutMethod')}</div>
          <div className="font-bold text-slate-700">{payout.method || 'MANUAL'}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] uppercase font-black text-slate-400">{t('payoutReference')}</div>
          <div className="font-bold text-slate-700 break-all">{payout.reference || '-'}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] uppercase font-black text-slate-400">{t('paidAt')}</div>
          <div className="font-bold text-slate-700">{payout.paidAt ? new Date(payout.paidAt).toLocaleString() : '-'}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] uppercase font-black text-slate-400">{t('orderStatus')}</div>
          <div className="font-bold text-slate-700">{payout.order?.status || '-'}</div>
        </div>
      </div>

      {payout.notes && <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
        <div className="text-[10px] uppercase font-black text-slate-400 mb-1">{t('notes')}</div>
        {payout.notes}
      </div>}

      {payout.status === 'PENDING' && <div className="space-y-2">
        <select className="w-full p-3 rounded-xl border text-sm" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
          {METHODS.map(method => <option key={method} value={method}>{method}</option>)}
        </select>

        <input className="w-full p-3 rounded-xl border text-sm" placeholder={t('payoutReferencePlaceholder')} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
        <textarea className="w-full p-3 rounded-xl border text-sm" placeholder={t('notes')} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

        <div className="grid grid-cols-2 gap-2">
          <button disabled={saving} onClick={markPaid} className="py-2 rounded-xl bg-green-600 text-white text-xs font-black disabled:opacity-40">
            Mark Paid
          </button>
          <button disabled={saving} onClick={cancelPayout} className="py-2 rounded-xl bg-red-50 text-red-700 text-xs font-black disabled:opacity-40">
            Cancel
          </button>
        </div>
      </div>}
    </div>}
  </div>;
}

export default function AdminPayoutManager({ token }) {
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
      const [payoutResult, summaryResult] = await Promise.all([
        api('/payouts/admin', { token }),
        api('/payouts/admin/summary', { token })
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
  }, [token]);

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

  if (loading) return <div className="bg-white rounded-2xl border p-4 text-sm text-slate-500">{t('loadingSettlements')}</div>;
  if (error) return <div className="bg-white rounded-2xl border p-4 text-sm text-red-600">{error}</div>;

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('pendingAmount')}</div>
        <div className="font-black text-slate-900 mt-1">{formatIQD(summary?.pendingAmount || 0)}</div>
      </div>
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('paidAmount')}</div>
        <div className="font-black text-slate-900 mt-1">{formatIQD(summary?.paidAmount || 0)}</div>
      </div>
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('pendingCount')}</div>
        <div className="font-black text-slate-900 mt-1">{summary?.pendingCount || 0}</div>
      </div>
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="text-[10px] text-slate-400 font-bold uppercase">{t('paidCount')}</div>
        <div className="font-black text-slate-900 mt-1">{summary?.paidCount || 0}</div>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-2">
      {['ALL', 'PENDING', 'PAID', 'CANCELLED'].map(status => (
        <button key={t(`payoutFilter${status}`)} onClick={() => setStatusFilter(status)} className={`py-2 rounded-xl text-[10px] font-black ${statusFilter === status ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'}`}>
          {t(`payoutFilter${status}`)}
        </button>
      ))}
    </div>

    <div className="bg-white rounded-2xl border p-3 space-y-2">
      <input
        className="w-full p-3 rounded-xl border text-sm"
        placeholder={t('searchSupplierOrderPart')}
        value={supplierSearch}
        onChange={e => setSupplierSearch(e.target.value)}
      />

      <select className="w-full p-3 rounded-xl border text-sm bg-white" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
        <option value="ALL">{t('allSuppliers')}</option>
        {supplierOptions.map(([supplierId, supplierName]) => (
          <option key={supplierId} value={supplierId}>{supplierName}</option>
        ))}
      </select>
    </div>

    <div className="text-[10px] text-slate-400 font-bold">
      {t('showingPayouts').replace('{shown}', filteredPayouts.length).replace('{total}', payouts.length)}
    </div>

    {filteredPayouts.length === 0 && <div className="bg-white border border-dashed rounded-2xl p-6 text-center text-sm text-slate-400">
      {t('noSupplierPayoutsFound')}
    </div>}

    {filteredPayouts.map(payout => <PayoutCard key={payout.id} payout={payout} token={token} reload={load} />)}
  </div>;
}
