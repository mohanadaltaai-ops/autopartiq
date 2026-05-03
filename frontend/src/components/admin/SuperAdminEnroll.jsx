import React, { useState } from 'react';
import { api } from '../../lib/api';

export default function SuperAdminEnroll({ token }) {
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

      setMessage(`${form.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} created successfully.`);
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
    <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
      <h2 className="font-black text-slate-900">Create Admin User</h2>

      <select
        className="w-full p-3 rounded-xl border"
        value={form.role}
        onChange={e =>
          setForm({
            ...form,
            role: e.target.value,
            adminPermission: e.target.value === 'SUPER_ADMIN' ? 'FULL_ADMIN' : form.adminPermission
          })
        }
      >
        <option value="ADMIN">Admin</option>
        <option value="SUPER_ADMIN">Super Admin</option>
      </select>

      {form.role === 'ADMIN' && (
        <select
          className="w-full p-3 rounded-xl border"
          value={form.adminPermission}
          onChange={e => setForm({ ...form, adminPermission: e.target.value })}
        >
          <option value="FULL_ADMIN">Full Admin: dashboard, suppliers, orders, audit</option>
          <option value="ORDERS_ONLY">Orders Only: order management only</option>
        </select>
      )}

      <input
        className="w-full p-3 rounded-xl border"
        placeholder="Full name"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />

      <input
        className="w-full p-3 rounded-xl border"
        placeholder="Phone number used for login"
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
      />

      <input
        className="w-full p-3 rounded-xl border"
        placeholder="Email optional"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />

      <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
        Admin and Super Admin users can log in from the main phone login screen using their registered phone number.
        The corner SA button remains available for emergency username/access-code access only.
      </div>

      {message && <div className="text-xs text-green-700 bg-green-50 rounded-xl p-2">{message}</div>}
      {error && <div className="text-xs text-red-700 bg-red-50 rounded-xl p-2">{error}</div>}

      <button
        onClick={submit}
        disabled={saving || !form.name.trim() || !form.phone.trim()}
        className="w-full py-3 rounded-2xl bg-purple-700 text-white font-black disabled:opacity-40"
      >
        {saving ? 'Saving...' : 'Create User'}
      </button>
    </div>
  );
}
