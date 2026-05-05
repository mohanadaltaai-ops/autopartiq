import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AuditLogViewer({ token }) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/audit-logs', { token })
      .then(result => setLogs(result.logs || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-sm text-slate-500">{t('loadingAuditLogs')}</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!logs.length) return <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">{t('noAuditLogsYet')}</div>;

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="bg-white rounded-2xl border p-4 shadow-sm">
          <div className="flex justify-between gap-3">
            <div className="font-bold text-slate-900">{log.action}</div>
            <div className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</div>
          </div>
          <div className="text-xs text-slate-500 mt-1">{log.entityType} {log.entityId ? `• ${log.entityId}` : ''}</div>
          <div className="text-xs text-slate-400 mt-1">{t('by')}: {log.actor?.name || t('system')}</div>
        </div>
      ))}
    </div>
  );
}
