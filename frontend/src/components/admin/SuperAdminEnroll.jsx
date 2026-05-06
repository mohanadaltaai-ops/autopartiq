import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SuperAdminEnroll({ token }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'ADMIN',
    adminPermission: 'FULL_ADMIN'
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api('/admin/users', {
        method: 'POST',
        token,
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          role: form.role,
          adminPermission: form.role === 'ADMIN' ? form.adminPermission : 'FULL_ADMIN'
        }
      });

      setMessage(form.role === 'SUPER_ADMIN' ? t('superAdminCreated') : t('adminCreated'));
      setForm({
        name: '',
        phone: '',
        email: '',
        role: 'ADMIN',
        adminPermission: 'FULL_ADMIN'
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-blue-100/80 bg-white/95 p-4 shadow-sm shadow-blue-950/5 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/20">
      <h2 className="font-black text-slate-950 dark:text-white">{t('createAdminUser')}</h2>

      <select
        className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20"
        value={form.role}
        onChange={e =>
          setForm({
            ...form,
            role: e.target.value,
            adminPermission: e.target.value === 'SUPER_ADMIN' ? 'FULL_ADMIN' : form.adminPermission
          })
        }
      >
        <option value="ADMIN">{t('roleAdmin')}</option>
        <option value="SUPER_ADMIN">{t('roleSuperAdmin')}</option>
      </select>

      {form.role === 'ADMIN' && (
        <select
          className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20"
          value={form.adminPermission}
          onChange={e => setForm({ ...form, adminPermission: e.target.value })}
        >
          <option value="FULL_ADMIN">{t('fullAdminDescription')}</option>
          <option value="ORDERS_ONLY">{t('ordersOnlyDescription')}</option>
        </select>
      )}

      <input
        className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20"
        placeholder={t('fullName')}
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />

      <input
        className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20"
        placeholder={t('phoneNumberForLogin')}
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
      />

      <input
        className="w-full rounded-2xl border border-blue-100 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/20"
        placeholder={t('email')}
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />

      <div className="rounded-2xl bg-blue-50/70 p-3 text-xs font-semibold text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
        {t('adminPhoneLoginNote')}
      </div>

      {message && <div className="text-xs text-green-700 bg-green-50 rounded-xl p-2">{message}</div>}
      {error && <div className="text-xs text-red-700 bg-red-50 rounded-xl p-2">{error}</div>}

      <button
        onClick={submit}
        disabled={saving || !form.name.trim() || !form.phone.trim()}
        className="w-full rounded-2xl bg-blue-600 py-3 font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-40"
      >
        {saving ? t('saving') : t('createUser')}
      </button>
    </div>
  );
}
