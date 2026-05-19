import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../lib/api';

function InfoCard({ label, value, tone = 'blue', dirClass = '' }) {
  const toneClass = tone === 'green'
    ? 'bg-green-50 text-green-700 border-green-100'
    : tone === 'red'
      ? 'bg-red-50 text-red-700 border-red-100'
      : 'bg-blue-50 text-blue-700 border-blue-100';

  return (
    <div className="rounded-[22px] bg-slate-50 border border-slate-100 p-3">
      <div className={`inline-flex px-2 py-1 rounded-full border text-[9px] leading-tight font-black uppercase ${toneClass}`}>
        {label}
      </div>
      <div className={`font-black text-slate-900 mt-2 break-words ${dirClass}`}>{value || '-'}</div>
    </div>
  );
}

function Section({ label, title, children }) {
  return (
    <div className="bg-white rounded-[30px] border border-slate-200 p-5 shadow-sm space-y-3">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
          {label}
        </div>
        {title && <h2 className="font-black text-2xl text-slate-950 mt-3 leading-tight">{title}</h2>}
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, token, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [customerRequests, setCustomerRequests] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [deletingVehicleId, setDeletingVehicleId] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user?.role !== 'CUSTOMER' || !token) return;

    Promise.all([
      api('/requests/mine', { token }),
      api('/orders/mine', { token }),
      api('/vehicles/mine', { token })
    ])
      .then(([requestsResult, ordersResult, vehiclesResult]) => {
        setCustomerRequests(requestsResult.requests || []);
        setCustomerOrders(ordersResult.orders || []);
        setSavedVehicles(vehiclesResult.vehicles || []);
      })
      .catch(() => {
        setCustomerRequests([]);
        setCustomerOrders([]);
        setSavedVehicles([]);
      });
  }, [user?.role, token]);

  async function deleteSavedVehicle(vehicleId) {
    if (!vehicleId) return;

    setDeletingVehicleId(vehicleId);
    try {
      await api(`/vehicles/${vehicleId}`, { method: 'DELETE', token });
      setSavedVehicles(current => current.filter(vehicle => vehicle.id !== vehicleId));
    } finally {
      setDeletingVehicleId('');
    }
  }

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

  const supplierMakes = (() => {
    try {
      const makes = JSON.parse(user?.supplier?.supportedMakesJson || '[]');
      return makes.length ? makes.join(', ') : '-';
    } catch {
      return '-';
    }
  })();

  return (
    <div className="p-4 space-y-4 pb-6">
      <div className="rounded-[30px] bg-[#27439C] text-white p-5 shadow-sm overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-8 bottom-4 w-16 h-16 rounded-full bg-orange-400/10 pointer-events-none" />

        <div className="relative">
          <div className="text-xs font-bold text-white/70">{t('profile')}</div>
          <div className="text-2xl font-black leading-tight mt-1">{user?.name || t('profile')}</div>
          <div className="inline-flex mt-3 px-3 py-1.5 rounded-full bg-white/12 border border-white/10 text-[10px] font-black">
            {roleLabel}
          </div>
        </div>
      </div>

      <Section label={t('profile')} title={t('profile')}>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <InfoCard label={t('phone')} value={user?.phone || '-'} dirClass="dir-ltr text-left" />
          {user?.email && <InfoCard label={t('email')} value={user.email} dirClass="dir-ltr text-left" />}
        </div>
      </Section>

      {user?.role === 'SUPPLIER' && user?.supplier && (
        <Section label={t('supplierDetails')} title={t('supplierDetails')}>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <InfoCard label={t('supplierName')} value={user.supplier.name || '-'} />
            <InfoCard label={t('phone')} value={user.supplier.phone || '-'} dirClass="dir-ltr text-left" />
            <InfoCard label={t('location')} value={user.supplier.location || '-'} />
            <InfoCard label={t('supportedMakes')} value={supplierMakes} />
            <InfoCard label={t('status')} value={user.supplier.isActive ? t('active') : t('inactive')} tone={user.supplier.isActive ? 'green' : 'red'} />
          </div>
        </Section>
      )}

      {user?.role === 'CUSTOMER' && (
        <Section label={t('customerSummary')} title={t('customerSummary')}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InfoCard label={t('totalRequests')} value={customerStats.total} />
            <InfoCard label={t('active')} value={customerStats.active} />
            <InfoCard label={t('completedOrders')} value={customerStats.completed} tone="green" />
            <InfoCard label={t('cancelled')} value={customerStats.cancelled} tone="red" />
          </div>
        </Section>
      )}

      {user?.role === 'CUSTOMER' && (
        <Section label="Saved cars" title="Saved car models">
          {savedVehicles.length === 0 ? (
            <div className="rounded-[22px] bg-slate-50 border border-dashed border-slate-200 p-5 text-sm font-bold text-slate-400 text-center">
              No saved cars yet. Save a car from New Request to reuse it faster next time.
            </div>
          ) : (
            <div className="space-y-2">
              {savedVehicles.map(vehicle => (
                <div key={vehicle.id} className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black text-slate-950 leading-tight truncate">
                      {vehicle.label || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-1 truncate">
                      {[vehicle.origin, vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' • ')}
                    </div>
                    {vehicle.isDefault && (
                      <div className="inline-flex mt-2 px-2 py-1 rounded-full bg-blue-50 border border-blue-100 text-[9px] uppercase font-black text-blue-700">
                        Default
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={deletingVehicleId === vehicle.id}
                    onClick={() => deleteSavedVehicle(vehicle.id)}
                    className="shrink-0 px-3 py-2 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-black disabled:opacity-50"
                  >
                    {deletingVehicleId === vehicle.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section label={t('settings')} title={t('settings')}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-[22px] bg-slate-50 border border-slate-100 p-3">
            <div>
              <div className="font-black text-slate-950">{t('language')}</div>
              <div className="text-xs text-slate-500 font-semibold mt-1">{language === 'ar' ? t('arabic') : t('english')}</div>
            </div>
            <button onClick={toggleLanguage} className="px-4 py-2.5 rounded-2xl bg-[#27439C] text-white text-sm font-black shadow-sm">
              {language === 'ar' ? 'EN' : 'AR'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[22px] bg-slate-50 border border-slate-100 p-3">
            <div>
              <div className="font-black text-slate-950">{t('mode')}</div>
              <div className="text-xs text-slate-500 font-semibold mt-1">{theme === 'dark' ? t('dark') : t('light')}</div>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-4 py-2.5 rounded-2xl bg-[#27439C] text-white text-sm font-black shadow-sm">
              {theme === 'dark' ? t('light') : t('dark')}
            </button>
          </div>
        </div>
      </Section>

      <Section label={t('support')} title="AutoParts IQ">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <a href="https://wa.me/7733664151" target="_blank" rel="noreferrer" className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 block">
            <div className="text-[10px] text-blue-600 font-black uppercase">{t('supportWhatsapp')}</div>
            <div className="font-black text-slate-900 dir-ltr text-left mt-1">07733664151</div>
          </a>

          <a href="mailto:support@autopartiq.com" className="rounded-[22px] bg-slate-50 border border-slate-100 p-3 block">
            <div className="text-[10px] text-blue-600 font-black uppercase">{t('supportEmail')}</div>
            <div className="font-black text-slate-900 break-all dir-ltr text-left mt-1">support@autopartiq.com</div>
          </a>
        </div>
      </Section>

      <Section label={t('accountDeletion')} title={t('accountDeletion')}>
        <div className="rounded-[22px] bg-red-50 border border-red-100 p-3 space-y-2">
          <div className="font-black text-red-700">{t('deleteAccountRequest')}</div>
          <div className="text-xs text-red-600 leading-relaxed font-semibold">{t('deleteAccountHelp')}</div>
          <a href={`mailto:support@autopartiq.com?subject=${deletionSubject}&body=${deletionBody}`} className="block w-full text-center py-3 rounded-2xl bg-red-600 text-white text-sm font-black">
            {t('requestAccountDeletion')}
          </a>
        </div>
      </Section>

      <button onClick={logout} className="w-full py-4 rounded-2xl bg-red-600 text-white font-black shadow-sm">
        {t('logout')}
      </button>
    </div>
  );
}
