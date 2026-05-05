import React, { useEffect, useMemo, useState } from 'react';
import { api, formatIQD } from '../../lib/api';

const METHODS = ['CASH', 'ZAINCASH', 'MANUAL', 'OTHER'];

function statusClass(status) {
  if (status === 'PAID') return 'bg-green-50 text-green-700 border-green-100';
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
}

function PayoutCard({ payout, token, reload }) {
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
    const reason = window.prompt('Cancellation reason');
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
          {payout.status}
        </div>
      </div>
    </button>

    {open && <div className="border-t pt-3 space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] uppercase font-black text-slate-400">Method</div>
          <div className="font-bold text-slate-700">{payout.method || 'MANUAL'}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] uppercase font-black text-slate-400">Reference</div>
          <div className="font-bold text-slate-700 break-all">{payout.reference || '-'}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] uppercase font-black text-slate-400">Paid At</div>
          <div className="font-bold text-slate-700">{payout.paidAt ? new Date(payout.paidAt).toLocaleString() : '-'}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] uppercase font-black text-slate-400">Order Status</div>
          <div className="font-bold text-slate-700">{payout.order?.status || '-'}</div>
        </div>
      </div>

      {payout.notes && <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
        <div className="text-[10px] uppercase font-black text-slate-400 mb-1">Notes</div>
        {payout.notes}
      </div>}

      {payout.status === 'PENDING' && <div className="space-y-2">
        <select className="w-full p-3 rounded-xl border text-sm" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
          {METHODS.map(method => <option key={method} value={method}>{method}</option>)}
        </select>

        <input className="w-full p-3 rounded-xl border text-sm" placeholder="Reference number / receipt note" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
        <textarea className="w-full p-3 rounded-xl border text-sm" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

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
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  const filteredPayouts = useMemo(() => {
    return payouts.filter(payout => statusFilter === 'ALL' || payout.status === statusFilter);
  }, [payouts, statusFilter]);

  if (loading) return <div className="bg-white rounded-2xl border p-4 text-sm text-slate-500">Loading settlements...</div>;
  if (error) return <div className="bg-white rounded-2xl border p-4 text-sm text-red-600">{error}</div>;

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Amount</div>
        <div className="font-black text-slate-900 mt-1">{formatIQD(summary?.pendingAmount || 0)}</div>
      </div>
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="text-[10px] text-slate-400 font-bold uppercase">Paid Amount</div>
        <div className="font-black text-slate-900 mt-1">{formatIQD(summary?.paidAmount || 0)}</div>
      </div>
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Count</div>
        <div className="font-black text-slate-900 mt-1">{summary?.pendingCount || 0}</div>
      </div>
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="text-[10px] text-slate-400 font-bold uppercase">Paid Count</div>
        <div className="font-black text-slate-900 mt-1">{summary?.paidCount || 0}</div>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-2">
      {['ALL', 'PENDING', 'PAID', 'CANCELLED'].map(status => (
        <button key={status} onClick={() => setStatusFilter(status)} className={`py-2 rounded-xl text-[10px] font-black ${statusFilter === status ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'}`}>
          {status}
        </button>
      ))}
    </div>

    <div className="text-[10px] text-slate-400 font-bold">
      Showing {filteredPayouts.length} of {payouts.length} payouts
    </div>

    {filteredPayouts.length === 0 && <div className="bg-white border border-dashed rounded-2xl p-6 text-center text-sm text-slate-400">
      No supplier payouts found.
    </div>}

    {filteredPayouts.map(payout => <PayoutCard key={payout.id} payout={payout} token={token} reload={load} />)}
  </div>;
}
