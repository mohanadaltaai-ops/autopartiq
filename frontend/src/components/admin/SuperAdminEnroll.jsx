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
    <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
      <h2 className="font-black text-slate-950">{t('createAdminUser')}</h2>

      <select
        className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
          className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          value={form.adminPermission}
          onChange={e => setForm({ ...form, adminPermission: e.target.value })}
        >
          <option value="FULL_ADMIN">{t('fullAdminDescription')}</option>
          <option value="ORDERS_ONLY">{t('ordersOnlyDescription')}</option>
        </select>
      )}

      <input
        className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        placeholder={t('fullName')}
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />

      <input
        className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        placeholder={t('phoneNumberForLogin')}
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
      />

      <input
        className="w-full p-3 rounded-2xl border bg-slate-50 text-sm font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        placeholder={t('email')}
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />

      <div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">
        {t('adminPhoneLoginNote')}
      </div>

      {message && <div className="text-xs text-green-700 bg-green-50 rounded-xl p-2">{message}</div>}
      {error && <div className="text-xs text-red-700 bg-red-50 rounded-xl p-2">{error}</div>}

      <button
        onClick={submit}
        disabled={saving || !form.name.trim() || !form.phone.trim()}
        className="w-full py-3 rounded-2xl bg-[#27439C] text-white font-black disabled:opacity-40"
      >
        {saving ? t('saving') : t('createUser')}
      </button>
    </div>
  );
}
