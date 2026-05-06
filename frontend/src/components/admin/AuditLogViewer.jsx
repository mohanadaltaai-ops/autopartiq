import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function auditActionLabel(action, t) {
  const normalizedAction = String(action || '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();

  const labels = {
    ADMIN_USER_CREATED: t('auditAdminUserCreated'),
    ORDER_STATUS_UPDATED: t('auditOrderStatusUpdated'),
    ORDER_PAYMENT_UPDATED: t('auditPaymentUpdated'),
    PAYMENT_UPDATED: t('auditPaymentUpdated'),
    ORDER_DELIVERY_UPDATED: t('auditDeliveryUpdated'),
    DELIVERY_UPDATED: t('auditDeliveryUpdated'),
    SUPPLIER_CREATED: t('auditSupplierCreated'),
    SUPPLIER_UPDATED: t('auditSupplierUpdated'),
    SUPPLIER_DISABLED: t('auditSupplierDisabled')
  };

  return labels[normalizedAction] || String(action || '').replaceAll('_', ' ');
}

function auditEntityLabel(entityType, t) {
  const labels = {
    User: t('user'),
    Order: t('order'),
    Supplier: t('supplier'),
    Payment: t('payment'),
    Delivery: t('delivery')
  };

  return labels[entityType] || entityType;
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

  if (loading) return <div className="bg-white rounded-[24px] border border-slate-200 p-3 shadow-sm text-sm font-bold text-slate-500">{t('loadingAuditLogs')}</div>;
  if (error) return <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>;
  if (!logs.length) return <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-6 text-center shadow-sm text-sm font-bold text-slate-500">{t('noAuditLogsYet')}</div>;

  return (
    <div className="space-y-3">
      {logs.map(log => {
        const metadata = parseAuditMetadata(log);
        const rows = metadataRows(metadata, t);

        return (
          <div key={log.id} className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <div className="font-black text-slate-950">{auditActionLabel(log.action, t)}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {auditEntityLabel(log.entityType, t)}
                  {log.entityId ? <span className="text-slate-400"> • {log.entityId}</span> : null}
                </div>
              </div>
              <div className="shrink-0 text-right text-[10px] font-bold text-slate-400">
                {new Date(log.createdAt).toLocaleString(language === 'ar' ? 'ar-IQ' : undefined)}
              </div>
            </div>

            {rows.length > 0 && (
              <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 text-xs space-y-1">
                {rows.map(([label, value]) => (
                  <div key={`${label}-${value}`} className="flex justify-between gap-3">
                    <span className="text-slate-400">{label}</span>
                    <strong className="text-slate-800 text-right">{String(value).replaceAll('_', ' ')}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-slate-400">{t('by')}: {log.actor?.name || t('system')}</div>
          </div>
        );
      })}
    </div>
  );
}
