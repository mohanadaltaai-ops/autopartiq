import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import logo from '../assets/logo.png';
import { formatMarketMoney, getMarketAppName, getMarketCode, getMarketCountryName, getMarketPhonePrefix } from '../lib/market';

export default function Login() {
  const { requestOtp, login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const marketCode = getMarketCode();
  const appName = getMarketAppName(language);
  const countryName = getMarketCountryName(language);
  const phonePrefix = getMarketPhonePrefix();
  const samplePrice = marketCode === 'AE' ? formatMarketMoney(120) : formatMarketMoney(120000);
  const [phone, setPhone] = useState('');
  const [screen, setScreen] = useState('landing');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

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
          changeNumber: 'تغيير الرقم'
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
          changeNumber: 'Change number'
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-600 p-4">
      <div className="phone-frame rounded-[42px] border-[7px] border-slate-950 overflow-hidden shadow-2xl flex flex-col relative bg-[#F5F7FC]">
        <button
          onClick={toggleLanguage}
          className="absolute top-6 left-6 z-20 px-4 h-11 rounded-[18px] bg-white text-slate-800 text-sm font-black shadow-md border border-slate-200"
          title={t('language')}
        >
          {language === 'en' ? 'AR' : 'EN'}
        </button>

        <button
          onClick={() => {
            window.location.href = '/super-access';
          }}
          className="absolute top-6 right-6 z-20 px-4 h-11 rounded-[18px] bg-[#2E3346] text-white text-sm font-black shadow-md border border-slate-700"
          title={t('adminAccess')}
        >
          SA
        </button>

        {screen === 'landing' ? (
          <div className="flex-1 px-8 pt-20 pb-5 flex flex-col bg-[linear-gradient(135deg,#F6F0EC_0%,#EEF3FF_55%,#F4F7FF_100%)]">
            <div className="flex justify-start">
              <div className="logo-surface w-[88px] h-[88px] rounded-[26px] bg-white shadow-sm border border-slate-100 flex items-center justify-center p-3">
                <img src={logo} alt={`${appName} Logo`} className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-[#F9F3EC] border border-[#F6E2CA] text-[#D45A11] text-[12px] font-black">
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              {copy.market}
            </div>

            <div className="mt-4">
              <h1 className={`${language === 'ar' ? 'text-[27px] leading-[1.12]' : 'text-[31px] leading-[1.0]'} font-black tracking-tight text-[#081B4B] whitespace-pre-line`}>
                {copy.heroTitle}
              </h1>
              <p className={`${language === 'ar' ? 'mt-2 text-[13px] leading-6' : 'mt-3 text-[14px] leading-7'} text-[#7A859E] font-semibold max-w-[300px]`}>
                {copy.heroSubtitle}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-center">
              <div className="relative h-[200px] w-full max-w-[300px]">
                <div className="absolute left-1/2 top-[8px] -translate-x-1/2 w-[190px] h-[190px] rounded-full bg-[#E8EEFF]" />
                <div className="absolute left-1/2 top-[35px] -translate-x-1/2 w-[124px] h-[124px] rounded-full bg-[#FDFDFE]" />

                <div className="absolute left-1/2 top-[48px] -translate-x-1/2 w-[112px] h-[112px] rounded-[24px] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] border border-slate-100 flex items-center justify-center">
                  <div
                    className="w-[74px] h-[56px] rounded-[12px] border border-slate-200 flex items-center justify-center text-[10px] font-black text-[#A2A9BC]"
                    style={{
                      background:
                        'repeating-linear-gradient(135deg, #F1F4FB 0px, #F1F4FB 6px, #EDF1F8 6px, #EDF1F8 12px)'
                    }}
                  >
                    {copy.partName}
                  </div>
                </div>

                <div className="absolute left-[4px] top-[132px] px-4 py-2.5 rounded-[16px] bg-[#F97316] text-white text-[12px] font-black shadow-[0_8px_20px_rgba(249,115,22,0.28)]">
                  {copy.price}
                </div>

                <div className="absolute right-[6px] top-[44px] px-4 py-2.5 rounded-[16px] bg-white text-[#2BB673] text-[12px] font-black shadow-sm border border-slate-100">
                  {copy.offers}
                </div>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="w-6 h-2 rounded-full bg-[#27439C]" />
              <span className="w-2 h-2 rounded-full bg-[#D5D9E6]" />
              <span className="w-2 h-2 rounded-full bg-[#D5D9E6]" />
            </div>

            <div className="mt-auto pt-4">
              <button
                onClick={() => setScreen('phone')}
                className="w-full h-14 rounded-[18px] bg-[#27439C] text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-[0_14px_30px_rgba(39,67,156,0.20)]"
              >
                <ArrowRight size={18} />
                {copy.getStarted}
              </button>

              <div className="mt-2 text-center text-[13px] leading-5 text-[#8C94A8] font-semibold">
                {copy.haveAccount}{' '}
                <button
                  onClick={() => setScreen('phone')}
                  className="text-[#27439C] font-black"
                >
                  {copy.logIn}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-[linear-gradient(180deg,#F7F9FD_0%,#EEF3FB_100%)]">
            <div className="px-7 pt-24 pb-6">
              <div className="flex items-center gap-4">
                <div className="logo-surface w-16 h-16 rounded-[22px] bg-white shadow-sm border border-slate-100 flex items-center justify-center p-2">
                  <img src={logo} alt={`${appName} Logo`} className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-[26px] font-black tracking-tight text-[#081B4B]">{appName}</div>
                  <div className="text-[12px] font-bold text-[#8B95A7]">{copy.phoneTitle}</div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex-1 flex flex-col justify-center gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F97316]">
                  {screen === 'phone' ? t('phoneNumber') : t('enterOtp')}
                </div>
                <h1 className="text-[28px] leading-tight font-black text-[#081B4B]">
                  {screen === 'phone' ? copy.phoneTitle : copy.otpTitle}
                </h1>
                <p className="text-[14px] text-[#8B95A7] font-semibold">
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
                        className="min-w-0 flex-1 h-14 px-4 rounded-[18px] bg-[#F8FAFD] border border-slate-200 outline-none text-[18px] font-bold text-left placeholder:text-left"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value);
                          setError('');
                        }}
                        placeholder={copy.phonePlaceholder}
                      />
                    </div>
                    <div className="mt-2 text-[11px] font-bold text-[#8B95A7]">
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

                  <button
                    onClick={() => setScreen('landing')}
                    className="text-[#8B95A7] text-sm font-bold"
                  >
                    {copy.back}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-3">
                    <input
                      className="w-full h-16 px-4 rounded-[18px] bg-[#F8FAFD] border border-slate-200 outline-none text-center text-[28px] tracking-[0.28em] font-black"
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

                  <button
                    onClick={() => setScreen('phone')}
                    className="text-[#8B95A7] text-sm font-bold"
                  >
                    {copy.changeNumber}
                  </button>
                </>
              )}

              {error && (
                <div className="rounded-[18px] bg-red-50 border border-red-100 text-red-700 text-sm font-bold p-4">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
