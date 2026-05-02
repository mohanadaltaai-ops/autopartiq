import React, { createContext, useContext, useMemo, useState } from 'react';

const translations = {
  en: {
    appName: 'AutoParts IQ',
    roleCustomer: 'CUSTOMER',
    roleSupplier: 'SUPPLIER',
    roleAdmin: 'ADMIN',
    home: 'Home',
    orders: 'Orders',
    leads: 'Leads',
    earnings: 'Earnings',
    suppliers: 'Suppliers',
    dashboard: 'Dashboard',
    logout: 'Logout',
    notifications: 'Notifications',
    close: 'Close',
    noNotifications: 'No notifications yet.',
    findParts: 'Find car parts faster',
    newRequest: '+ New Part Request',
    myRequests: 'My Requests',
    noRequests: 'No part requests yet.',
    noOrders: 'No orders yet.',
    submitRequest: 'Submit Request',
    aiIdentify: 'AI Identify Part',
    analyzing: 'Analyzing...',
    cancelRequest: 'Cancel request',
    confirmCancel: 'Confirm cancel',
    keepRequest: 'Keep request',
    adminDashboard: 'AutoPartIQ Admin',
    platformOverview: 'Platform overview'
  },
  ar: {
    appName: 'أوتو بارتس IQ',
    roleCustomer: 'عميل',
    roleSupplier: 'مورد',
    roleAdmin: 'مشرف',
    home: 'الرئيسية',
    orders: 'الطلبات',
    leads: 'الطلبات الجديدة',
    earnings: 'الأرباح',
    suppliers: 'الموردون',
    dashboard: 'لوحة التحكم',
    logout: 'خروج',
    notifications: 'الإشعارات',
    close: 'إغلاق',
    noNotifications: 'لا توجد إشعارات حالياً.',
    findParts: 'اعثر على قطع غيار سيارتك بسرعة',
    newRequest: '+ طلب قطعة جديد',
    myRequests: 'طلباتي',
    noRequests: 'لا توجد طلبات قطع بعد.',
    noOrders: 'لا توجد طلبات بعد.',
    submitRequest: 'إرسال الطلب',
    aiIdentify: 'تحديد القطعة بالذكاء الاصطناعي',
    analyzing: 'جاري التحليل...',
    cancelRequest: 'إلغاء الطلب',
    confirmCancel: 'تأكيد الإلغاء',
    keepRequest: 'الاحتفاظ بالطلب',
    adminDashboard: 'إدارة أوتو بارت IQ',
    platformOverview: 'نظرة عامة على المنصة'
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const value = useMemo(() => ({
    language,
    direction: language === 'ar' ? 'rtl' : 'ltr',
    t: key => translations[language][key] || translations.en[key] || key,
    toggleLanguage: () => {
      const next = language === 'en' ? 'ar' : 'en';
      localStorage.setItem('language', next);
      setLanguage(next);
    }
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
