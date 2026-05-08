export const MARKETS = {
  IQ: {
    code: 'IQ',
    appName: {
      en: 'Auto Parts IQ',
      ar: 'أوتو بارتس IQ'
    },
    countryName: {
      en: 'Iraq',
      ar: 'العراق'
    },
    currency: 'IQD',
    phonePrefix: '+964',
    defaultLanguage: 'ar',
    supportEmail: 'support@autopartiq.com',
    cities: ['Basra', 'Baghdad', 'Erbil', 'Najaf', 'Karbala'],
    features: {
      uaeVat: false,
      emiratesSelector: false,
      iqLocalPayments: true
    }
  },
  AE: {
    code: 'AE',
    appName: {
      en: 'Auto Parts AE',
      ar: 'أوتو بارتس AE'
    },
    countryName: {
      en: 'United Arab Emirates',
      ar: 'الإمارات العربية المتحدة'
    },
    currency: 'AED',
    phonePrefix: '+971',
    defaultLanguage: 'en',
    supportEmail: 'support@autopartsae.com',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    features: {
      uaeVat: true,
      emiratesSelector: true,
      iqLocalPayments: false
    }
  }
};

export const DEFAULT_MARKET = 'IQ';
