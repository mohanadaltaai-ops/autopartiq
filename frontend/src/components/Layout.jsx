import React, { useEffect, useState } from 'react';
import { Bell, Home, Package, User, BarChart3, Users, ShieldCheck, UserPlus, Wallet, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getMarketAppName } from '../lib/market';
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

  if (metadata.type === 'NEW_ORDER') {
    return metadata.orderNumber
      ? `New order created: ${metadata.orderNumber}`
      : 'New order created';
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

function notificationVisual(item) {
  const metadata = parseNotificationMetadata(item);
  const type = metadata.type || '';

  if (type === 'NEW_LEAD' || type === 'NEW_REQUEST') {
    return { icon: '🏷', bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' };
  }

  if (type === 'NEW_OFFER') {
    return { icon: '💬', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' };
  }

  if (type === 'OFFER_ACCEPTED') {
    return { icon: '✓', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' };
  }

  if (type === 'ORDER_PAYMENT_UPDATED' || type === 'PAYOUT_SENT' || type === 'PAYOUT_MARKED_PAID') {
    return { icon: '💳', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' };
  }

  if (type === 'ORDER_DELIVERY_UPDATED' || type === 'ORDER_STATUS_UPDATED' || type === 'PROOF_OF_DELIVERY_UPDATED') {
    return { icon: '📦', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' };
  }

  if (type === 'OFFER_REJECTED' || type === 'ORDER_CANCELLED') {
    return { icon: '×', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' };
  }

  if (type === 'REVIEW_RECEIVED') {
    return { icon: '☆', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' };
  }

  return { icon: '•', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-blue-500' };
}

function resetMainScrollPosition() {
  if (typeof window === 'undefined') return;

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const scrollTargets = document.querySelectorAll('main, [data-scroll-container], .overflow-y-auto, .overflow-auto');
  scrollTargets.forEach(target => {
    if (target && typeof target.scrollTo === 'function') {
      target.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else if (target) {
      target.scrollTop = 0;
    }
  });
}


export default function Layout({ tab, setTab, children }) {
  useEffect(() => {
    resetMainScrollPosition();
  }, [tab]);

  const { user, token } = useAuth();
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const roleColor = {
    CUSTOMER: 'text-blue-600',
    SUPPLIER: 'text-blue-600',
    ADMIN: 'text-blue-600',
    SUPER_ADMIN: 'text-blue-600'
  }[user?.role] || 'text-slate-800';

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
    if (!token || !['CUSTOMER', 'SUPPLIER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role)) return;
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

  return <div className="min-h-screen h-screen flex items-center justify-center p-4 bg-slate-600 overflow-hidden">
    <div className="phone-frame rounded-[42px] border-[7px] border-slate-950 shadow-2xl overflow-hidden flex flex-col relative apiq-page">
      <header className="shrink-0 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setTab(user?.adminPermission === 'ORDERS_ONLY' ? 'orders' : 'home')} className="logo-surface w-12 h-12 rounded-[18px] overflow-hidden border border-slate-200 flex items-center justify-center p-1.5 shadow-sm">
            <img src={logo} alt="AutoParts IQ Logo" className="w-full h-full object-contain scale-95" />
          </button>

          <div>
            <div className="font-black text-slate-900 leading-tight tracking-tight">{getMarketAppName(language)}</div>
            <div className={`text-[10px] font-black ${roleColor}`}>{roleLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tab !== 'home' && user?.adminPermission !== 'ORDERS_ONLY' && (
            <button onClick={() => setTab('home')} className="px-3 h-9 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black shadow-sm">
              {t('home')}
            </button>
          )}

          <button onClick={() => setTab('profile')} className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-sm transition ${tab === 'profile' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-slate-50 text-slate-600 border-slate-200'}`} title={t('profile')}>
            <User size={18}/>
            <span className="sr-only">{t('profile')}</span>
          </button>

          {['CUSTOMER', 'SUPPLIER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
            <button onClick={toggleNotifications} className="relative w-10 h-10 rounded-2xl bg-slate-50 border flex items-center justify-center shadow-sm transition">
              <Bell size={17}/>
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black ring-2 ring-white">{unreadCount}</span>}
            </button>
          )}
        </div>
      </header>

      {showNotifications && (
        <div className="absolute top-[76px] right-4 left-4 z-20 bg-white rounded-[30px] border border-slate-200 shadow-2xl p-4 space-y-3 max-h-[68vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-950 text-xl leading-tight">{t('notifications')}</h3>
              <div className="text-xs text-slate-500 font-semibold mt-1">{unreadCount} {t('unread') || 'unread'}</div>
            </div>
            <button onClick={() => setShowNotifications(false)} className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-sm font-black">
              ×
            </button>
          </div>

          {notifications.length === 0 && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[24px] p-6 text-center text-sm font-bold text-slate-400">
              {t('noNotifications')}
            </div>
          )}

          <div className="space-y-2">
            {notifications.map(item => {
              const metadata = parseNotificationMetadata(item);
              const clickable = metadata.requestId || metadata.offerId || metadata.orderId;
              const visual = notificationVisual(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className="w-full text-left bg-white rounded-[24px] p-3 text-slate-700 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${visual.bg} ${visual.text} flex items-center justify-center font-black shrink-0`}>
                      {visual.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-black text-slate-950 leading-tight">{notificationText(item, t)}</div>
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${visual.dot}`} />
                      </div>

                      <div className="text-[10px] text-slate-400 font-semibold mt-1">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      </div>

                      {clickable && (
                        <div className="text-[10px] text-blue-600 font-black mt-1">
                          {t('tapToOpen')}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-3">{children}</main>

      <nav className="shrink-0 bg-white/95 backdrop-blur border-t border-slate-200 px-2 pt-2 pb-3 flex gap-1 overflow-x-auto">
        {tabs.map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`min-w-[64px] flex-1 py-2.5 px-2 rounded-2xl text-[10px] font-black flex flex-col items-center gap-1 transition ${tab === id ? 'bg-[#0F172A] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Icon size={18}/>
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  </div>;
}
