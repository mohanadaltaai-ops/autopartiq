export const MARKETS = {
  IQ: {
    code: 'IQ',
    appName: {
      en: 'PartLink IQ',
      ar: '\u0628\u0627\u0631\u062a \u0644\u064a\u0646\u0643 \u0627\u0644\u0639\u0631\u0627\u0642'
    },
    countryName: {
      en: 'Iraq',
      ar: '\u0627\u0644\u0639\u0631\u0627\u0642'
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
      en: 'PartLink AE',
      ar: '\u0628\u0627\u0631\u062a \u0644\u064a\u0646\u0643 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a'
    },
    countryName: {
      en: 'United Arab Emirates',
      ar: '\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u062a\u062d\u062f\u0629'
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

