import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

function AdminUserCard({ admin, token, reload }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isDisabled = String(admin.phone || '').startsWith('disabled:');
  const isAppOwner = Boolean(admin.isAppOwner);

  const [form, setForm] = useState({
    name: admin.name || '',
    phone: isDisabled ? '' : (admin.phone || ''),
    email: admin.email || '',
    username: admin.username && !String(admin.username).startsWith('disabled:') ? admin.username : '',
    role: admin.role || 'ADMIN',
    adminPermission: admin.adminPermission || 'FULL_ADMIN',
    market: admin.market || 'IQ'
  });

  async function save() {
    if (isAppOwner) {
      setError(t('appOwnerProtected'));
      setEditing(false);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api(`/admin/users/${admin.id}`, {
        method: 'PATCH',
        token,
        body: {
          ...form,
          adminPermission: form.role === 'ADMIN' ? form.adminPermission : 'FULL_ADMIN'
        }
      });

      setEditing(false);
      setOpen(false);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function disable() {
    if (isAppOwner) {
      setError(t('appOwnerProtected'));
      return;
    }

    if (!window.confirm(t('confirmDisableAdmin'))) return;

    setSaving(true);
    setError('');

    try {
      await api(`/admin/users/${admin.id}`, { method: 'DELETE', token });
      setOpen(false);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-black">
                {admin.role === 'SUPER_ADMIN' ? t('roleSuperAdmin') : t('roleAdmin')}
              </span>
              <span className="text-[10px] px-2 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100 font-black">
                {admin.market === 'AE' ? t('uaeMarket') : t('iraqMarket')}
              </span>
              {isAppOwner && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-black">
                  {t('appOwner')}
                </span>
              )}
              {isDisabled && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 font-black">
                  {t('disabled')}
                </span>
              )}
            </div>
            <div className="font-black text-slate-950 text-lg leading-tight mt-2">{admin.name || t('notAvailable')}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">{admin.adminPermission || 'FULL_ADMIN'}</div>
          </div>
          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center text-lg font-black transition ${
            open ? 'bg-[#27439C] text-white border-[#27439C]' : 'bg-slate-50 text-slate-400 border-slate-100'
          }`}>
            {open ? '−' : '+'}
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {!editing ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                  <div className="text-[10px] uppercase font-black text-blue-600">{t('phone')}</div>
                  <div className="text-xs font-black text-slate-700 mt-1 break-words">{admin.phone || '-'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                  <div className="text-[10px] uppercase font-black text-blue-600">{t('email')}</div>
                  <div className="text-xs font-black text-slate-700 mt-1 break-words">{admin.email || '-'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 col-span-2">
                  <div className="text-[10px] uppercase font-black text-blue-600">{t('username')}</div>
                  <div className="text-xs font-black text-slate-700 mt-1 break-words">{admin.username || '-'}</div>
                </div>
              </div>

              {error && <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-2xl p-3 font-bold">{error}</div>}

              {isAppOwner ? (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-xs font-black text-amber-700">
                  {t('appOwnerProtected')}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setEditing(true)} className="py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-black">
                    {t('edit')}
                  </button>
                  <button type="button" onClick={disable} disabled={saving || isDisabled} className="py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-black disabled:opacity-40">
                    {saving ? t('saving') : t('disable')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('fullName')} />
              <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={t('phoneNumberForLogin')} />
              <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={t('email')} />
              <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder={t('username')} />

              <select className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.role} onChange={e => setForm({ ...form, role: e.target.value, adminPermission: e.target.value === 'SUPER_ADMIN' ? 'FULL_ADMIN' : form.adminPermission })}>
                <option value="ADMIN">{t('roleAdmin')}</option>
                <option value="SUPER_ADMIN">{t('roleSuperAdmin')}</option>
              </select>

              {form.role === 'ADMIN' && (
                <select className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.adminPermission} onChange={e => setForm({ ...form, adminPermission: e.target.value })}>
                  <option value="FULL_ADMIN">{t('fullAdminDescription')}</option>
                  <option value="ORDERS_ONLY">{t('ordersOnlyDescription')}</option>
                </select>
              )}

              <select className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.market} onChange={e => setForm({ ...form, market: e.target.value })}>
                <option value="IQ">{t('iraqMarket')}</option>
                <option value="AE">{t('uaeMarket')}</option>
              </select>

              {error && <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-2xl p-3 font-bold">{error}</div>}

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setEditing(false)} className="py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black">
                  {t('cancel')}
                </button>
                <button type="button" onClick={save} disabled={saving} className="py-3 rounded-2xl bg-[#27439C] text-white text-sm font-black disabled:opacity-40">
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminEnroll({ token, marketFilter = 'ALL' }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    role: 'ADMIN',
    adminPermission: 'FULL_ADMIN',
    market: 'IQ'
  });
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadUsers() {
    setLoadingUsers(true);
    const marketQuery = `?market=${marketFilter || 'ALL'}`;
    try {
      const result = await api(`/admin/users${marketQuery}`, { token });
      setUsers(result.users || []);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [token, marketFilter]);

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
          username: form.username.trim(),
          password: form.password.trim(),
          role: form.role,
          adminPermission: form.role === 'ADMIN' ? form.adminPermission : 'FULL_ADMIN',
          market: form.market
        }
      });

      setMessage(form.role === 'SUPER_ADMIN' ? t('superAdminCreated') : t('adminCreated'));
      setForm({
        name: '',
        phone: '',
        email: '',
        username: '',
        password: '',
        role: 'ADMIN',
        adminPermission: 'FULL_ADMIN',
        market: form.market
      });
      await loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm space-y-3">
        <div>
          <div className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black mb-2">
            {t('adminUsers')}
          </div>
          <h2 className="font-black text-slate-950 text-lg">{t('createAdminUser')}</h2>
        </div>

        <select className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.role} onChange={e => setForm({ ...form, role: e.target.value, adminPermission: e.target.value === 'SUPER_ADMIN' ? 'FULL_ADMIN' : form.adminPermission })}>
          <option value="ADMIN">{t('roleAdmin')}</option>
          <option value="SUPER_ADMIN">{t('roleSuperAdmin')}</option>
        </select>

        {form.role === 'ADMIN' && (
          <select className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.adminPermission} onChange={e => setForm({ ...form, adminPermission: e.target.value })}>
            <option value="FULL_ADMIN">{t('fullAdminDescription')}</option>
            <option value="ORDERS_ONLY">{t('ordersOnlyDescription')}</option>
          </select>
        )}

        <select className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" value={form.market} onChange={e => setForm({ ...form, market: e.target.value })}>
          <option value="IQ">{t('iraqMarket')}</option>
          <option value="AE">{t('uaeMarket')}</option>
        </select>

        <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" placeholder={t('fullName')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" placeholder={t('phoneNumberForLogin')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" placeholder={t('email')} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" placeholder={t('username')} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        <input className="w-full p-3 rounded-2xl border bg-slate-50 font-bold" placeholder={t('password')} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

        <div className="rounded-[24px] bg-slate-50 border border-slate-100 p-4 text-xs leading-6 text-slate-600 font-semibold">
          {t('adminLoginHint')}
        </div>

        {message && <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-2xl p-3 font-bold">{message}</div>}
        {error && <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-2xl p-3 font-bold">{error}</div>}

        <button onClick={submit} disabled={saving || !form.name.trim() || !form.phone.trim()} className="w-full py-3.5 rounded-2xl bg-[#27439C] text-white font-black disabled:opacity-40 shadow-sm">
          {saving ? t('saving') : t('createUser')}
        </button>
      </div>

      <div className="space-y-3">
        <div className="font-black text-slate-950">{t('adminUsers')}</div>
        {loadingUsers ? (
          <div className="bg-white rounded-[28px] border border-slate-200 p-5 text-sm font-bold text-slate-500 shadow-sm">{t('loadingDashboard')}</div>
        ) : users.length ? (
          users.map(admin => <AdminUserCard key={admin.id} admin={admin} token={token} reload={loadUsers} />)
        ) : (
          <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400 shadow-sm">
            {t('noAdminUsersYet')}
          </div>
        )}
      </div>
    </div>
  );
}
