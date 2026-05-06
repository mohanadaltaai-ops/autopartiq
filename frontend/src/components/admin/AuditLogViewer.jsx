import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function auditActionLabel(action, t, language) {
  const normalizedAction = String(action || '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();

  const arLabels = {
    ADMIN_USER_CREATED: 'تم إنشاء مستخدم إداري',
    ORDER_STATUS_UPDATED: 'تم تحديث حالة الطلب',
    ORDER_PAYMENT_UPDATED: 'تم تحديث الدفع',
    PAYMENT_UPDATED: 'تم تحديث الدفع',
    ORDER_DELIVERY_UPDATED: 'تم تحديث التوصيل',
    DELIVERY_UPDATED: 'تم تحديث التوصيل',
    SUPPLIER_CREATED: 'تم إنشاء مورد',
    SUPPLIER_UPDATED: 'تم تحديث المورد',
    SUPPLIER_DISABLED: 'تم تعطيل المورد',
    SUPPLIER_PAYOUT_MARKED_PAID: 'تم تعليم دفعة المورد كمدفوعة',
    PAYOUT_MARKED_PAID: 'تم تعليم الدفعة كمدفوعة',
    SUPPLIER_PAYOUT_CANCELLED: 'تم إلغاء دفعة المورد',
    PAYOUT_CANCELLED: 'تم إلغاء الدفعة',
    PAYOUT_CREATED: 'تم إنشاء دفعة',
    SUPPLIER_PAYOUT_CREATED: 'تم إنشاء دفعة مورد'
  };

  const enLabels = {
    ADMIN_USER_CREATED: t('auditAdminUserCreated'),
    ORDER_STATUS_UPDATED: t('auditOrderStatusUpdated'),
    ORDER_PAYMENT_UPDATED: t('auditPaymentUpdated'),
    PAYMENT_UPDATED: t('auditPaymentUpdated'),
    ORDER_DELIVERY_UPDATED: t('auditDeliveryUpdated'),
    DELIVERY_UPDATED: t('auditDeliveryUpdated'),
    SUPPLIER_CREATED: t('auditSupplierCreated'),
    SUPPLIER_UPDATED: t('auditSupplierUpdated'),
    SUPPLIER_DISABLED: t('auditSupplierDisabled'),
    SUPPLIER_PAYOUT_MARKED_PAID: 'Supplier payout marked paid',
    PAYOUT_MARKED_PAID: 'Payout marked paid',
    SUPPLIER_PAYOUT_CANCELLED: 'Supplier payout cancelled',
    PAYOUT_CANCELLED: 'Payout cancelled',
    PAYOUT_CREATED: 'Payout created',
    SUPPLIER_PAYOUT_CREATED: 'Supplier payout created'
  };

  const labels = language === 'ar' ? arLabels : enLabels;
  return labels[normalizedAction] || String(action || '').replaceAll('_', ' ');
}

function auditEntityLabel(entityType, t, language) {
  const normalizedEntity = String(entityType || '');

  const arLabels = {
    User: 'مستخدم',
    Order: 'طلب',
    Supplier: 'مورد',
    Payment: 'دفع',
    Delivery: 'توصيل',
    SupplierPayout: 'دفعة مورد',
    Payout: 'دفعة'
  };

  const enLabels = {
    User: t('user'),
    Order: t('order'),
    Supplier: t('supplier'),
    Payment: t('payment'),
    Delivery: t('delivery'),
    SupplierPayout: 'Supplier payout',
    Payout: 'Payout'
  };

  const labels = language === 'ar' ? arLabels : enLabels;
  return labels[normalizedEntity] || normalizedEntity;
}

function parseAuditMetadata(log) {
  try {
    return JSON.parse(log.metadataJson || '{}');
  } catch {
    return {};
  }
}

function metadataRows(metadata, t) {
  const rows = [];

  if (metadata.from || metadata.to) {
    rows.push([t('from'), metadata.from || '-']);
    rows.push([t('to'), metadata.to || '-']);
  }

  if (metadata.paymentMethod) {
    rows.push([t('payment'), metadata.paymentMethod]);
  }

  if (metadata.paymentStatus) {
    rows.push([t('paymentStatus'), metadata.paymentStatus]);
  }

  return rows;
}

export default function AuditLogViewer({ token }) {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/audit-logs', { token })
      .then(result => setLogs(result.logs || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="bg-white rounded-[28px] border border-slate-200 p-5 text-sm font-bold text-slate-500 shadow-sm">{t('loadingAuditLogs')}</div>;
  if (error) return <div className="bg-red-50 rounded-[28px] border border-red-100 p-5 text-sm font-bold text-red-700 shadow-sm">{error}</div>;
  if (!logs.length) {
    return (
      <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-6 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black mb-3">—</div>
        <div className="text-sm font-bold text-slate-500">{t('noAuditLogsYet')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map(log => {
        const metadata = parseAuditMetadata(log);
        const rows = metadataRows(metadata, t);

        return (
          <div key={log.id} className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black mb-2">
                  {auditEntityLabel(log.entityType, t, language)}
                </div>
                <div className="font-black text-slate-950 leading-tight">{auditActionLabel(log.action, t, language)}</div>
                <div className="text-xs text-slate-500 font-semibold mt-1">
                  {log.entityId ? <span>{log.entityId}</span> : null}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 text-right shrink-0 font-semibold">
                {new Date(log.createdAt).toLocaleString(language === 'ar' ? 'ar-IQ' : undefined)}
              </div>
            </div>

            {rows.length > 0 && (
              <div className="rounded-[20px] bg-slate-50 border border-slate-100 p-3 text-xs space-y-1">
                {rows.map(([label, value]) => (
                  <div key={`${label}-${value}`} className="flex justify-between gap-3">
                    <span className="text-slate-400 font-bold">{label}</span>
                    <strong className="text-slate-700 text-right">{String(value).replaceAll('_', ' ')}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-slate-400 font-semibold">{t('by')}: {log.actor?.name || t('system')}</div>
          </div>
        );
      })}
    </div>
  );
}
