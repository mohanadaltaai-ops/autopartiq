import React, { useState } from 'react';
import { api, uploadImage } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function cleanPayload(form) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, typeof value === 'string' && !value.trim() ? null : value])
  );
}

export default function OrderDeliveryControls({ order, token, reload }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    driverName: order.driverName || '',
    driverPhone: order.driverPhone || '',
    pickupEta: order.pickupEta || '',
    deliveryEta: order.deliveryEta || '',
    proofOfDeliveryUrl: order.proofOfDeliveryUrl || '',
    deliveryNotes: order.deliveryNotes || ''
  });
  const [saving, setSaving] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [error, setError] = useState('');

  async function uploadProofImage(file) {
    if (!file) return;

    setUploadingProof(true);
    setError('');

    try {
      const result = await uploadImage(file, { token, context: 'delivery-proof' });
      const uploadedUrl = result.url || result.fileUrl || result.publicUrl;

      if (!uploadedUrl) {
        throw new Error(t('uploadFailed'));
      }

      setForm(current => ({ ...current, proofOfDeliveryUrl: uploadedUrl }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingProof(false);
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api(`/orders/${order.id}/delivery`, { method: 'PATCH', token, body: cleanPayload(form) });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 space-y-3">
      <div>
        <div className="text-xs font-black text-slate-700">{t('deliveryAssignment')}</div>
        <div className="text-[10px] text-slate-400">{t('deliveryAssignmentHint')}</div>
      </div>

      <div className="rounded-[20px] bg-white border border-slate-200 p-3 space-y-2">
        <div className="text-[10px] uppercase font-black text-blue-600">{t('driverDetails')}</div>
        <input className="w-full p-2 rounded-xl border bg-white text-xs font-bold" placeholder={t('driverName')} value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
        <input className="w-full p-2 rounded-xl border bg-white text-xs font-bold" placeholder={t('driverPhone')} value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} />
      </div>

      <div className="rounded-[20px] bg-white border border-slate-200 p-3 space-y-2">
        <div className="text-[10px] uppercase font-black text-blue-600">{t('pickupAndDelivery')}</div>

        <label className="text-[10px] font-bold text-slate-500 space-y-1 block">
          {t('pickupEta')}
          <input type="date" className="w-full p-2 rounded-xl border bg-white text-xs font-bold" value={form.pickupEta} onChange={e => setForm({ ...form, pickupEta: e.target.value })} />
        </label>

        <label className="text-[10px] font-bold text-slate-500 space-y-1 block">
          {t('deliveryEta')}
          <input type="date" className="w-full p-2 rounded-xl border bg-white text-xs font-bold" value={form.deliveryEta} onChange={e => setForm({ ...form, deliveryEta: e.target.value })} />
        </label>
      </div>

      <div className="rounded-[20px] bg-white border border-slate-200 p-3 space-y-2">
        <div className="text-[10px] uppercase font-black text-blue-600">{t('deliveryNotesTitle')}</div>
        <label className="block">
          <div className="text-[10px] font-bold text-slate-500 mb-1">{t('proofOfDeliveryImage')}</div>
          <input
            type="file"
            accept="image/*"
            disabled={uploadingProof}
            className="w-full p-2 rounded-xl border bg-white text-xs font-bold disabled:opacity-50"
            onChange={e => uploadProofImage(e.target.files?.[0])}
          />
        </label>

        {uploadingProof && (
          <div className="text-[10px] text-blue-600 font-bold">{t('uploading')}</div>
        )}

        {form.proofOfDeliveryUrl && (
          <a href={form.proofOfDeliveryUrl} target="_blank" rel="noreferrer" className="block rounded-xl border bg-white p-2 text-xs text-blue-700 font-black break-all">
            {t('viewProofOfDelivery')}
          </a>
        )}

        <input className="w-full p-2 rounded-xl border bg-white text-xs font-bold" placeholder={t('proofOfDeliveryUrl')} value={form.proofOfDeliveryUrl} onChange={e => setForm({ ...form, proofOfDeliveryUrl: e.target.value })} />
        <textarea className="w-full p-2 rounded-xl border bg-white text-xs font-bold min-h-[80px]" placeholder={t('deliveryNotes')} value={form.deliveryNotes} onChange={e => setForm({ ...form, deliveryNotes: e.target.value })} />
      </div>

      {error && <div className="text-xs text-red-600">{error}</div>}

      <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-[#27439C] text-white text-xs font-black disabled:opacity-40">
        {saving ? t('saving') : t('updateDelivery')}
      </button>
    </div>
  );
}
