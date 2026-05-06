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

  if (loading) return <div className="rounded-[1.35rem] border border-blue-100/80 bg-white/95 p-3 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('loadingAuditLogs')}</div>;
  if (error) return <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>;
  if (!logs.length) return <div className="rounded-[1.5rem] border border-dashed border-blue-200 bg-white/80 p-6 text-center text-sm font-bold text-slate-400 dark:text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-500">{t('noAuditLogsYet')}</div>;

  return (
    <div className="space-y-3">
      {logs.map(log => {
        const metadata = parseAuditMetadata(log);
        const rows = metadataRows(metadata, t);

        return (
          <div key={log.id} className="space-y-3 rounded-[1.5rem] border border-blue-100/80 bg-white/95 p-4 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/20">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <div className="font-black text-slate-950 dark:text-white">{auditActionLabel(log.action, t)}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  {auditEntityLabel(log.entityType, t)}
                  {log.entityId ? <span className="text-slate-400 dark:text-slate-500"> • {log.entityId}</span> : null}
                </div>
              </div>
              <div className="shrink-0 text-right text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-500">
                {new Date(log.createdAt).toLocaleString(language === 'ar' ? 'ar-IQ' : undefined)}
              </div>
            </div>

            {rows.length > 0 && (
              <div className="space-y-1 rounded-2xl bg-blue-50/70 p-3 text-xs dark:bg-slate-800/80">
                {rows.map(([label, value]) => (
                  <div key={`${label}-${value}`} className="flex justify-between gap-3">
                    <span className="text-slate-400 dark:text-slate-500">{label}</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-right">{String(value).replaceAll('_', ' ')}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-slate-400 dark:text-slate-500">{t('by')}: {log.actor?.name || t('system')}</div>
          </div>
        );
      })}
    </div>
  );
}
