import React, { useEffect, useState } from 'react';
import { Bell, Home, Package, User, BarChart3, Users, ShieldCheck, UserPlus, Wallet, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../lib/api';
import logo from '../assets/logo.png';

function parseNotificationMetadata(item) {
  try {
    return JSON.parse(item.metadataJson || '{}');
  } catch {
    return {};
  }
}

function notificationText(item, t) {
  const metadata = parseNotificationMetadata(item);

  if (metadata.type === 'NEW_LEAD') {
    return metadata.partName
      ? `${t('newLeadNotification')}: ${metadata.partName}`
      : t('newLeadNotification');
  }

  if (metadata.type === 'NEW_OFFER') {
    return metadata.partName
      ? `${t('newOfferNotification')}: ${metadata.partName}`
      : t('newOfferNotification');
  }

  if (metadata.type === 'OFFER_ACCEPTED') {
    return metadata.orderNumber
      ? `${t('offerAcceptedNotification')}: ${metadata.orderNumber}`
      : t('offerAcceptedNotification');
  }

  if (metadata.type === 'ORDER_STATUS_UPDATED') {
    return metadata.orderNumber
      ? `${t('orderStatusUpdatedNotification')}: ${metadata.orderNumber}`
      : t('orderStatusUpdatedNotification');
  }

  if (metadata.type === 'ORDER_PAYMENT_UPDATED') {
    return metadata.orderNumber
      ? `${t('orderPaymentUpdatedNotification')}: ${metadata.orderNumber}`
      : t('orderPaymentUpdatedNotification');
  }

  if (metadata.type === 'ORDER_DELIVERY_UPDATED') {
    return metadata.orderNumber
      ? `${t('orderDeliveryUpdatedNotification')}: ${metadata.orderNumber}`
      : t('orderDeliveryUpdatedNotification');
  }

  if (metadata.type === 'PROOF_OF_DELIVERY_UPDATED') {
    return metadata.orderNumber
      ? `${t('proofOfDeliveryUpdatedNotification')}: ${metadata.orderNumber}`
      : t('proofOfDeliveryUpdatedNotification');
  }

  return item.message;
}

export default function Layout({ tab, setTab, children }) {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const roleColor = {
    CUSTOMER: 'text-orange-600',
    SUPPLIER: 'text-blue-600',
    ADMIN: 'text-purple-600',
    SUPER_ADMIN: 'text-red-600'
  }[user?.role] || 'text-slate-800';

  const activeColor = user?.role === 'SUPPLIER'
    ? 'text-blue-600'
    : ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
      ? 'text-purple-600'
      : 'text-orange-600';

  const roleLabel =
    user?.role === 'CUSTOMER' ? t('roleCustomer') :
    user?.role === 'SUPPLIER' ? t('roleSupplier') :
    user?.role === 'SUPER_ADMIN' ? t('roleSuperAdmin') :
    t('roleAdmin');

  const adminTabs = user?.role === 'SUPER_ADMIN'
    ? [
        ['home', BarChart3, t('dashboard')],
        ['orders', Package, t('orders')],
        ['suppliers', Users, t('suppliers')],
        ['settlements', Wallet, t('settlements')],
        ['more', MoreHorizontal, t('more')]
      ]
    : user?.adminPermission === 'ORDERS_ONLY'
      ? [
          ['orders', Package, t('orders')]
        ]
      : [
          ['home', BarChart3, t('dashboard')],
          ['orders', Package, t('orders')],
          ['suppliers', Users, t('suppliers')],
          ['settlements', Wallet, t('settlements')],
          ['more', MoreHorizontal, t('more')]
        ];

  const tabs = user?.role === 'CUSTOMER'
    ? [
        ['home', Home, t('home')],
        ['orders', Package, t('orders')]
      ]
    : user?.role === 'SUPPLIER'
      ? [
          ['home', Home, t('leads')],
          ['orders', Package, t('orders')],
          ['earnings', BarChart3, t('earnings')]
        ]
      : adminTabs;

  async function loadNotifications() {
    if (!token || !['CUSTOMER', 'SUPPLIER'].includes(user?.role)) return;
    const result = await api('/notifications/mine', { token });
    setNotifications(result.notifications || []);
    setUnreadCount(result.unreadCount || 0);
  }

  async function toggleNotifications() {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) {
      await loadNotifications();
      await api('/notifications/read', { method: 'PATCH', token });
      setUnreadCount(0);
    }
  }

  function openNotification(item) {
    const metadata = parseNotificationMetadata(item);
    if (metadata.requestId || metadata.offerId || metadata.orderId) {
      localStorage.setItem('notificationTarget', JSON.stringify(metadata));
      setShowNotifications(false);
      setTab(metadata.tab || (metadata.orderId ? 'orders' : 'home'));
      window.dispatchEvent(new CustomEvent('autopartiq:navigate-notification', { detail: metadata }));
    }
  }

  useEffect(() => {
    loadNotifications().catch(() => {});
  }, [token, user?.role]);

  return <div className="min-h-screen h-screen flex items-center justify-center p-5 bg-slate-600 overflow-hidden">
    <div className="phone-frame bg-slate-100 rounded-[40px] border-8 border-slate-900 shadow-2xl overflow-hidden flex flex-col relative">
      <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setTab(user?.adminPermission === 'ORDERS_ONLY' ? 'orders' : 'home')} className="logo-surface w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-1.5 shadow-sm">
            <img src={logo} alt="AutoParts IQ Logo" className="w-full h-full object-contain scale-95" />
          </button>

          <div>
            <div className="font-black text-slate-900 leading-tight">{t('appName')}</div>
            <div className={`text-[10px] font-bold ${roleColor}`}>{roleLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tab !== 'home' && user?.adminPermission !== 'ORDERS_ONLY' && (
            <button onClick={() => setTab('home')} className="px-3 h-9 rounded-xl bg-slate-50 border text-xs font-bold">
              {t('home')}
            </button>
          )}

          <button onClick={() => setTab('profile')} className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-sm ${tab === 'profile' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`} title={t('profile')}>
            <User size={18}/>
            <span className="sr-only">{t('profile')}</span>
          </button>

          {['CUSTOMER', 'SUPPLIER'].includes(user?.role) && (
            <button onClick={toggleNotifications} className="relative w-9 h-9 rounded-xl bg-slate-50 border flex items-center justify-center">
              <Bell size={17}/>
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
            </button>
          )}
        </div>
      </header>

      {showNotifications && (
        <div className="absolute top-16 right-4 left-4 z-20 bg-white rounded-2xl border shadow-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900">{t('notifications')}</h3>
            <button onClick={() => setShowNotifications(false)} className="text-slate-400 text-sm">{t('close')}</button>
          </div>

          {notifications.length === 0 && <div className="text-sm text-slate-400 py-4 text-center">{t('noNotifications')}</div>}

          {notifications.map(item => {
            const metadata = parseNotificationMetadata(item);
            const clickable = metadata.requestId || metadata.offerId || metadata.orderId;

            return (
              <button key={item.id} onClick={() => openNotification(item)} className="w-full text-left text-sm bg-slate-50 rounded-xl p-3 text-slate-700 hover:bg-orange-50">
                <div>{notificationText(item, t)}</div>
                {clickable && <div className="text-[10px] text-orange-600 font-bold mt-1">{t('tapToOpen')}</div>}
              </button>
            );
          })}
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-2">{children}</main>

      <nav className="shrink-0 bg-white border-t border-slate-200 flex overflow-x-auto">
        {tabs.map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`min-w-[64px] flex-1 py-3 text-[10px] font-bold flex flex-col items-center gap-1 ${tab === id ? activeColor : 'text-slate-400'}`}>
            <Icon size={18}/>
            {label}
          </button>
        ))}
      </nav>
    </div>
  </div>;
}
