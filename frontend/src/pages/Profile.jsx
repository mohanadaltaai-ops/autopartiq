import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../lib/api';

export default function Profile() {
  const { user, token, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [customerRequests, setCustomerRequests] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user?.role !== 'CUSTOMER' || !token) return;

    Promise.all([
      api('/requests/mine', { token }),
      api('/orders/mine', { token })
    ])
      .then(([requestsResult, ordersResult]) => {
        setCustomerRequests(requestsResult.requests || []);
        setCustomerOrders(ordersResult.orders || []);
      })
      .catch(() => {
        setCustomerRequests([]);
        setCustomerOrders([]);
      });
  }, [user?.role, token]);

  const roleLabel =
    user?.role === 'CUSTOMER' ? t('roleCustomer') :
    user?.role === 'SUPPLIER' ? t('roleSupplier') :
    user?.role === 'SUPER_ADMIN' ? t('roleSuperAdmin') :
    t('roleAdmin');

  const customerStats = {
    total: customerRequests.length,
    active: customerRequests.filter(req => !['COMPLETED', 'CANCELLED'].includes(req.status)).length,
    completed: customerOrders.filter(order => order.status === 'COMPLETED').length,
    cancelled: customerRequests.filter(req => req.status === 'CANCELLED').length
  };

  const deletionSubject = encodeURIComponent('AutoParts IQ account deletion request');
  const deletionBody = encodeURIComponent(`Please delete my AutoParts IQ account and related personal data.

Phone: ${user?.phone || '-'}
Role: ${user?.role || '-'}
Name: ${user?.name || '-'}`);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase">{t('profile')}</div>
        <div className="text-xl font-black text-slate-900">{user?.name || t('profile')}</div>
        <div className="text-sm text-slate-500">{roleLabel}</div>

        <div className="grid grid-cols-1 gap-2 pt-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-400 font-bold">{t('phone')}</div>
            <div className="font-bold text-slate-800">{user?.phone || '-'}</div>
          </div>

          {user?.email && (
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('email')}</div>
              <div className="font-bold text-slate-800">{user.email}</div>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'SUPPLIER' && user?.supplier && (
        <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase">{t('supplierDetails')}</div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('supplierName')}</div>
              <div className="font-bold text-slate-800">{user.supplier.name || '-'}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('phone')}</div>
              <div className="font-bold text-slate-800 dir-ltr text-left">{user.supplier.phone || '-'}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('location')}</div>
              <div className="font-bold text-slate-800">{user.supplier.location || '-'}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('supportedMakes')}</div>
              <div className="font-bold text-slate-800">
                {(() => {
                  try {
                    const makes = JSON.parse(user.supplier.supportedMakesJson || '[]');
                    return makes.length ? makes.join(', ') : '-';
                  } catch {
                    return '-';
                  }
                })()}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('status')}</div>
              <div className={`font-bold ${user.supplier.isActive ? 'text-green-700' : 'text-red-700'}`}>
                {user.supplier.isActive
                  ? t('active')
                  : t('inactive')}
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'CUSTOMER' && (
        <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase">{t('customerSummary')}</div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('totalRequests')}</div>
              <div className="text-xl font-black text-slate-900">{customerStats.total}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('active')}</div>
              <div className="text-xl font-black text-blue-700">{customerStats.active}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('completedOrders')}</div>
              <div className="text-xl font-black text-green-700">{customerStats.completed}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('cancelled')}</div>
              <div className="text-xl font-black text-red-700">{customerStats.cancelled}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase">{t('settings')}</div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
          <div>
            <div className="font-bold text-slate-900">{t('language')}</div>
            <div className="text-xs text-slate-500">{language === 'ar' ? t('arabic') : t('english')}</div>
          </div>
          <button onClick={toggleLanguage} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">
            {language === 'ar' ? 'EN' : 'AR'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
          <div>
            <div className="font-bold text-slate-900">{t('mode')}</div>
            <div className="text-xs text-slate-500">{theme === 'dark' ? t('dark') : t('light')}</div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold"
          >
            {theme === 'dark' ? t('light') : t('dark')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase">{t('support')}</div>
        <div className="text-sm text-slate-600 font-bold">AutoParts IQ</div>

        <div className="grid grid-cols-1 gap-2 text-sm">
          <a
            href="https://wa.me/7733664151"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-slate-50 p-3 block"
          >
            <div className="text-xs text-slate-400 font-bold">{t('supportWhatsapp')}</div>
            <div className="font-bold text-slate-800 dir-ltr text-left">07733664151</div>
          </a>

          <a
            href="mailto:support@autopartiq.com"
            className="rounded-2xl bg-slate-50 p-3 block"
          >
            <div className="text-xs text-slate-400 font-bold">{t('supportEmail')}</div>
            <div className="font-bold text-slate-800 break-all dir-ltr text-left">support@autopartiq.com</div>
          </a>
        </div>
      </div>

      <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase">{t('accountDeletion')}</div>
        <div className="rounded-2xl bg-red-50 border border-red-100 p-3 space-y-2">
          <div className="font-black text-red-700">{t('deleteAccountRequest')}</div>
          <div className="text-xs text-red-600 leading-relaxed">{t('deleteAccountHelp')}</div>
          <a
            href={`mailto:support@autopartiq.com?subject=${deletionSubject}&body=${deletionBody}`}
            className="block w-full text-center py-3 rounded-2xl bg-red-600 text-white text-sm font-black"
          >
            {t('requestAccountDeletion')}
          </a>
        </div>
      </div>

      <button onClick={logout} className="w-full py-4 rounded-2xl bg-red-600 text-white font-black">
        {t('logout')}
      </button>
    </div>
  );
}
