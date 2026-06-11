import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import logo from '../assets/logo.png';
import { formatMarketMoney, getMarketAppName, getMarketCode, getMarketCountryName, getMarketPhonePrefix } from '../lib/market';

export default function Login() {
  const { sendMagicLink, requestOtp, login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  const marketCode = getMarketCode();
  const appName = getMarketAppName(language);
  const countryName = getMarketCountryName(language);
  const phonePrefix = getMarketPhonePrefix();
  const samplePrice = marketCode === 'AE' ? formatMarketMoney(120) : formatMarketMoney(120000);

  const [screen, setScreen] = useState('landing');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [sendingMagic, setSendingMagic] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');

  const copy = useMemo(() => {
    const englishMarket = marketCode === 'AE'
      ? 'UAE spare parts marketplace'
      : 'Iraqi spare parts marketplace';

    const arabicMarket = marketCode === 'AE'
      ? 'سوق قطع الغيار في الإمارات'
      : 'سوق قطع الغيار العراقي';

    return language === 'ar'
      ? {
          market: arabicMarket,
          heroTitle: 'اعثر على أي قطعة سيارة.\nواحصل على عروض خلال دقائق.',
          heroSubtitle: `أرسل طلباً واحداً — وسيتنافس الموردون المعتمدون في ${countryName} لتلبيته.`,
          getStarted: 'ابدأ الآن',
          haveAccount: 'لديك حساب؟',
          logIn: 'تسجيل الدخول',
          partName: 'BRAKE PAD',
          price: samplePrice,
          offers: '+3 عروض',
          phoneTitle: 'تسجيل الدخول برقم الهاتف',
          phoneHint: 'أدخل رقم هاتفك للمتابعة',
          phonePlaceholder: marketCode === 'AE' ? '+971 5X XXX XXXX' : '+964 7XX XXX XXXX',
          phoneHelper: marketCode === 'AE' ? 'أدخل رقمك الإماراتي مع رمز الدولة +971' : 'أدخل رقمك العراقي مع رمز الدولة +964',
          phoneValidationError: marketCode === 'AE' ? 'يرجى إدخال رقم إماراتي صحيح مثل +9715XXXXXXXX' : 'يرجى إدخال رقم عراقي صحيح مثل +9647XXXXXXXXX',
          otpTitle: 'أدخل رمز التحقق',
          otpHint: 'أدخل رمز التحقق المرسل إليك',
          continue: 'متابعة',
          verify: 'تحقق وتسجيل الدخول',
          back: 'رجوع',
          changeNumber: 'تغيير الرقم',
          emailTitle: 'تسجيل الدخول بالبريد الإلكتروني',
          emailHint: 'أدخل بريدك الإلكتروني وسنرسل لك رابط دخول آمن',
          magicSentTitle: 'تحقق من بريدك الإلكتروني',
          magicSentHint: 'أرسلنا رابط الدخول. افتح أحدث رسالة لإكمال تسجيل الدخول.',
          sendMagic: 'إرسال رابط الدخول',
          sendingMagic: 'جارٍ الإرسال...',
          sendAnotherMagic: 'إرسال رابط آخر',
          invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
          magicSendFailed: 'تعذر إرسال رابط الدخول'
        }
      : {
          market: englishMarket,
          heroTitle: 'Find any car part.\nQuoted in minutes.',
          heroSubtitle: `Send one request — verified suppliers across ${countryName} compete to fulfill it.`,
          getStarted: 'Get started',
          haveAccount: 'Have an account?',
          logIn: 'Log in',
          partName: 'BRAKE PAD',
          price: samplePrice,
          offers: '+3 offers',
          phoneTitle: 'Phone number sign in',
          phoneHint: 'Enter your phone number to continue',
          phonePlaceholder: marketCode === 'AE' ? '+971 5X XXX XXXX' : '+964 7XX XXX XXXX',
          phoneHelper: marketCode === 'AE' ? 'Enter your UAE mobile number with +971' : 'Enter your Iraq mobile number with +964',
          phoneValidationError: marketCode === 'AE' ? 'Enter a valid UAE mobile number like +9715XXXXXXXX' : 'Enter a valid Iraq mobile number like +9647XXXXXXXXX',
          otpTitle: 'Enter verification code',
          otpHint: 'Enter the verification code sent to you',
          continue: 'Continue',
          verify: 'Verify & sign in',
          back: 'Back',
          changeNumber: 'Change number',
          emailTitle: 'Email sign in',
          emailHint: 'Enter your email and we will send you a secure sign-in link',
          magicSentTitle: 'Check your email',
          magicSentHint: 'We sent your sign-in link. Open the latest email to complete login.',
          sendMagic: 'Send sign-in link',
          sendingMagic: 'Sending link...',
          sendAnotherMagic: 'Send another link',
          invalidEmail: 'Enter a valid email address',
          magicSendFailed: 'Could not send sign-in link'
        };
  }, [language, marketCode, countryName, samplePrice]);

  function normalizePhoneNumber(value) {
    const compact = String(value || '').replace(/\s+/g, '').replace(/-/g, '');

    if (compact.startsWith('+')) return compact;
    if (compact.startsWith('00')) return `+${compact.slice(2)}`;

    if (marketCode === 'AE') {
      if (compact.startsWith('05')) return `+971${compact.slice(1)}`;
      if (compact.startsWith('5')) return `+971${compact}`;
    }

    if (marketCode === 'IQ') {
      if (compact.startsWith('07')) return `+964${compact.slice(1)}`;
      if (compact.startsWith('7')) return `+964${compact}`;
    }

    return compact.startsWith(phonePrefix.replace('+', ''))
      ? `+${compact}`
      : compact;
  }

  function isValidMarketPhone(value) {
    if (marketCode === 'AE') return /^\+9715\d{8}$/.test(value);
    if (marketCode === 'IQ') return /^\+9647\d{9}$/.test(value);
    return Boolean(value);
  }

  async function submitMagicLink() {
    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(copy.invalidEmail);
      return;
    }

    try {
      setSendingMagic(true);
      setError('');
      await sendMagicLink(cleanEmail);
      setMagicSent(true);
    } catch (e) {
      setError(e.message || copy.magicSendFailed);
    } finally {
      setSendingMagic(false);
    }
  }

  async function continueToOtp() {
    const normalized = normalizePhoneNumber(phone);

    if (!isValidMarketPhone(normalized)) {
      setPhone(normalized);
      setError(copy.phoneValidationError);
      return;
    }

    try {
      setSendingOtp(true);
      setError('');
      setPhone(normalized);
      await requestOtp(normalized);
      setScreen('otp');
    } catch (e) {
      const message = e.message || '';

      if (
        message.includes('Failed to reach API') ||
        message.includes('Internal server error') ||
        message.includes('API request failed with status')
      ) {
        setError(t('loginServerError'));
        return;
      }

      setError(message || t('otpSendFailed'));
    } finally {
      setSendingOtp(false);
    }
  }

  async function submit() {
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError(t('otpRequired'));
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    if (!isValidMarketPhone(normalizedPhone)) {
      setPhone(normalizedPhone);
      setError(copy.phoneValidationError);
      return;
    }

    try {
      setError('');
      await login(normalizedPhone, cleanOtp);
    } catch (e) {
      const message = e.message || '';

      if (
        message.includes('Failed to reach API') ||
        message.includes('Internal server error') ||
        message.includes('API request failed with status')
      ) {
        setError(t('loginServerError'));
        return;
      }

      setError(message || t('incorrectOtp'));
    }
  }

  function renderLanding() {
    return (
      <div className="flex-1 flex flex-col bg-[#F5F7FC] dark:bg-slate-950">
        <div className="px-7 pt-16 pb-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-full max-w-[340px] h-[112px] flex items-center justify-center overflow-visible">
              <img src={logo} alt={appName} className="w-full h-full object-contain scale-[1.65]" />
            </div>
            <div className="mt-3 text-[13px] font-black text-[#8B95A7] dark:text-slate-300 dark:text-slate-300">{copy.market}</div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-[#F9F3EC] border border-[#F6E2CA] text-[#D45A11] text-[12px] font-black">
            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            {copy.market}
          </div>

          <div className="mt-4">
            <h1 className={`${language === 'ar' ? 'text-[27px] leading-[1.12]' : 'text-[31px] leading-[1.0]'} font-black tracking-tight text-[#081B4B] dark:text-white whitespace-pre-line`}>
              {copy.heroTitle}
            </h1>
            <p className={`${language === 'ar' ? 'mt-2 text-[13px] leading-6' : 'mt-3 text-[14px] leading-7'} text-[#7A859E] dark:text-slate-300 font-semibold max-w-[300px]`}>
              {copy.heroSubtitle}
            </p>
          </div>

          <div className="mt-7 rounded-[30px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black text-[#F97316] tracking-[0.18em]">LIVE QUOTE</div>
                <div className="text-[22px] font-black text-[#081B4B] dark:text-white dark:text-white mt-1">{copy.partName}</div>
              </div>
              <div className="text-right">
                <div className="text-[18px] font-black text-[#27439C] dark:text-blue-300">{copy.price}</div>
                <div className="text-[11px] font-black text-[#8B95A7] dark:text-slate-300 dark:text-slate-300 mt-1">{copy.offers}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto px-6 pb-7">
          <button
            onClick={() => setScreen('phone')}
            className="w-full h-14 rounded-[18px] bg-[#27439C] dark:bg-blue-700 text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-[0_14px_30px_rgba(39,67,156,0.20)]"
          >
            <ArrowRight size={18} />
            {copy.getStarted}
          </button>

          <div className="mt-2 text-center text-[13px] leading-5 text-[#8C94A8] font-semibold">
            {copy.haveAccount}{' '}
            <button onClick={() => setScreen('phone')} className="text-[#27439C] font-black">
              {copy.logIn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderAeMagicLogin() {
    return (
      <div className="flex-1 flex flex-col bg-[linear-gradient(180deg,#F7F9FD_0%,#EEF3FB_100%)] dark:bg-none dark:bg-slate-950">
        <div className="px-7 pt-24 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden">
              <img src={logo} alt={appName} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-[26px] font-black tracking-tight text-[#081B4B] dark:text-white">{appName}</div>
              <div className="text-[12px] font-bold text-[#8B95A7] dark:text-slate-300">{copy.emailTitle}</div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex-1 flex flex-col justify-center gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F97316]">
              MAGIC LINK
            </div>
            <h1 className="text-[28px] leading-tight font-black text-[#081B4B] dark:text-white">
              {magicSent ? copy.magicSentTitle : copy.emailTitle}
            </h1>
            <p className="text-[14px] text-[#8B95A7] dark:text-slate-300 font-semibold">
              {magicSent ? copy.magicSentHint : copy.emailHint}
            </p>
          </div>

          {!magicSent ? (
            <>
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-3">
                <input
                  dir="ltr"
                  inputMode="email"
                  type="email"
                  className="w-full h-14 px-4 rounded-[18px] bg-[#F8FAFD] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-[16px] font-bold text-left placeholder:text-left"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="name@example.com"
                />
              </div>

              <button
                onClick={submitMagicLink}
                disabled={!email.trim() || sendingMagic}
                className="w-full h-14 rounded-[18px] bg-[#27439C] text-white font-black text-[15px] disabled:opacity-40 shadow-[0_14px_30px_rgba(39,67,156,0.20)]"
              >
                {sendingMagic ? copy.sendingMagic : copy.sendMagic}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMagicSent(false);
                setError('');
              }}
              className="w-full h-14 rounded-[18px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#27439C] font-black text-[15px]"
            >
              {copy.sendAnotherMagic}
            </button>
          )}

          <button onClick={() => setScreen('landing')} className="text-[#8B95A7] dark:text-slate-300 text-sm font-bold">
            {copy.back}
          </button>

          {error && (
            <div className="mt-2 rounded-[20px] bg-red-50 border border-red-100 px-4 py-3 text-red-700 text-sm font-bold">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderPhoneOtpLogin() {
    return (
      <div className="flex-1 flex flex-col bg-[linear-gradient(180deg,#F7F9FD_0%,#EEF3FB_100%)] dark:bg-none dark:bg-slate-950">
        <div className="px-7 pt-24 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden">
              <img src={logo} alt={appName} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-[26px] font-black tracking-tight text-[#081B4B] dark:text-white">{appName}</div>
              <div className="text-[12px] font-bold text-[#8B95A7] dark:text-slate-300">{copy.phoneTitle}</div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex-1 flex flex-col justify-center gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F97316]">
              {screen === 'phone' ? t('phoneNumber') : t('enterOtp')}
            </div>
            <h1 className="text-[28px] leading-tight font-black text-[#081B4B] dark:text-white">
              {screen === 'phone' ? copy.phoneTitle : copy.otpTitle}
            </h1>
            <p className="text-[14px] text-[#8B95A7] dark:text-slate-300 font-semibold">
              {screen === 'phone' ? copy.phoneHint : copy.otpHint}
            </p>
          </div>

          {screen === 'phone' ? (
            <>
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-3">
                <div dir="ltr" className="flex items-center gap-2">
                  <div className="h-14 px-3 rounded-[18px] bg-blue-50 border border-blue-100 text-blue-700 text-sm font-black flex items-center justify-center whitespace-nowrap">
                    {phonePrefix}
                  </div>
                  <input
                    dir="ltr"
                    inputMode="tel"
                    className="min-w-0 flex-1 h-14 px-4 rounded-[18px] bg-[#F8FAFD] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-[18px] font-bold text-left placeholder:text-left"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    placeholder={copy.phonePlaceholder}
                  />
                </div>
                <div className="mt-2 text-[11px] font-bold text-[#8B95A7] dark:text-slate-300">
                  {copy.phoneHelper}
                </div>
              </div>

              <button
                onClick={continueToOtp}
                disabled={!phone.trim() || sendingOtp}
                className="w-full h-14 rounded-[18px] bg-[#27439C] text-white font-black text-[15px] disabled:opacity-40 shadow-[0_14px_30px_rgba(39,67,156,0.20)]"
              >
                {sendingOtp ? t('sendingOtp') : copy.continue}
              </button>

              <button onClick={() => setScreen('landing')} className="text-[#8B95A7] dark:text-slate-300 text-sm font-bold">
                {copy.back}
              </button>
            </>
          ) : (
            <>
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-3">
                <input
                  className="w-full h-16 px-4 rounded-[18px] bg-[#F8FAFD] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-center text-[28px] tracking-[0.28em] font-black"
                  value={otp}
                  onChange={e => {
                    setOtp(e.target.value);
                    setError('');
                  }}
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="••••"
                />
              </div>

              <button
                onClick={submit}
                disabled={!otp.trim()}
                className="w-full h-14 rounded-[18px] bg-[#27439C] text-white font-black text-[15px] disabled:opacity-40 shadow-[0_14px_30px_rgba(39,67,156,0.20)]"
              >
                {copy.verify}
              </button>

              <button onClick={() => setScreen('phone')} className="text-[#8B95A7] dark:text-slate-300 text-sm font-bold">
                {copy.changeNumber}
              </button>
            </>
          )}

          {error && (
            <div className="mt-2 rounded-[20px] bg-red-50 border border-red-100 px-4 py-3 text-red-700 text-sm font-bold">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-600 p-4">
      <div className="phone-frame rounded-[42px] border-[7px] border-slate-950 overflow-hidden shadow-2xl flex flex-col relative bg-[#F5F7FC] dark:bg-slate-950">
        <button
          onClick={toggleLanguage}
          className="absolute top-6 left-6 z-20 px-4 h-11 rounded-[18px] bg-white dark:bg-slate-900 text-slate-800 dark:text-white dark:text-white text-sm font-black shadow-md border border-slate-200"
          title={t('language')}
        >
          {language === 'en' ? 'AR' : 'EN'}
        </button>

        <a
          href="/super-access"
          className="absolute top-6 right-6 z-20 px-4 h-11 rounded-[18px] bg-slate-900 text-white text-sm font-black shadow-md flex items-center justify-center"
          title="Super Admin"
        >
          SA
        </a>

        {screen === 'landing'
          ? renderLanding()
          : marketCode === 'AE'
            ? renderAeMagicLogin()
            : renderPhoneOtpLogin()}
      </div>
    </div>
  );
}
