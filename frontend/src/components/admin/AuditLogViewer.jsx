import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function AuditLogViewer({ token }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/audit-logs', { token })
      .then(result => setLogs(result.logs || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-sm text-slate-500">Loading audit logs...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!logs.length) return <div className="bg-white rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">No audit logs yet.</div>;

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="bg-white rounded-2xl border p-4 shadow-sm">
          <div className="flex justify-between gap-3">
            <div className="font-bold text-slate-900">{log.action}</div>
            <div className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</div>
          </div>
          <div className="text-xs text-slate-500 mt-1">{log.entityType} {log.entityId ? `• ${log.entityId}` : ''}</div>
          <div className="text-xs text-slate-400 mt-1">By: {log.actor?.name || 'System'}</div>
        </div>
      ))}
    </div>
  );
}
