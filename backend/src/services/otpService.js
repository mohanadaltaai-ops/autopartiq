import crypto from 'crypto';
import { OTPiqClient } from 'otpiq';
import { prisma } from '../db.js';

const OTP_PROVIDER = process.env.OTP_PROVIDER || 'test';
const TEST_OTP = process.env.TEST_OTP || '1234';
const TEST_OTP_ALLOWED_PHONES = String(process.env.TEST_OTP_ALLOWED_PHONES || '')
  .split(',')
  .map(phone => normalizePhoneForTestOtp(phone))
  .filter(Boolean);
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'local-otp-secret';

const IQ_OTP_PROVIDER = process.env.IQ_OTP_PROVIDER || 'test';
const AE_OTP_PROVIDER = process.env.AE_OTP_PROVIDER || 'test';

const OTPIQ_API_KEY = process.env.OTPIQ_API_KEY || '';
const OTPIQ_PRIMARY_PROVIDER = process.env.OTPIQ_PRIMARY_PROVIDER || 'whatsapp-sms';
const OTPIQ_FALLBACK_PROVIDER = process.env.OTPIQ_FALLBACK_PROVIDER || 'sms';

const D7_API_TOKEN = process.env.D7_API_TOKEN || '';
const D7_BASE_URL = process.env.D7_BASE_URL || 'https://api.d7networks.com';
const D7_ORIGINATOR = process.env.D7_ORIGINATOR || 'SignOTP';
const D7_CONTENT_TEMPLATE = process.env.D7_CONTENT_TEMPLATE || 'Your Auto Parts AE verification code is: {}';
const D7_EXPIRY_SECONDS = Number(process.env.D7_EXPIRY_SECONDS || OTP_EXPIRY_MINUTES * 60);

function normalizePhoneForTestOtp(phone) {
  const compact = String(phone || '').replace(/\s+/g, '').replace(/-/g, '');

  if (!compact) return '';
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('00')) return `+${compact.slice(2)}`;
  if (compact.startsWith('07')) return `+964${compact.slice(1)}`;
  if (compact.startsWith('7')) return `+964${compact}`;
  if (compact.startsWith('05')) return `+971${compact.slice(1)}`;
  if (compact.startsWith('5')) return `+971${compact}`;

  return compact;
}

function isAllowedTestOtpPhone(phone) {
  return TEST_OTP_ALLOWED_PHONES.includes(normalizePhoneForTestOtp(phone));
}

function normalizeMarket(market) {
  return market === 'AE' ? 'AE' : 'IQ';
}

function providerForMarket(market) {
  const normalizedMarket = normalizeMarket(market);

  if (OTP_PROVIDER === 'market') {
    return normalizedMarket === 'AE' ? AE_OTP_PROVIDER : IQ_OTP_PROVIDER;
  }

  return OTP_PROVIDER;
}

function hashOtp({ phone, otp }) {
  return crypto
    .createHmac('sha256', OTP_HASH_SECRET)
    .update(`${phone}:${String(otp).trim()}`)
    .digest('hex');
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function phoneForOtpiq(phone) {
  return String(phone || '').replace(/^\+/, '');
}

function phoneForD7(phone) {
  const compact = String(phone || '').replace(/\s+/g, '').replace(/-/g, '');
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('00')) return `+${compact.slice(2)}`;
  if (compact.startsWith('05')) return `+971${compact.slice(1)}`;
  if (compact.startsWith('5')) return `+971${compact}`;
  return compact;
}

async function latestActiveChallenge(phone, market) {
  return prisma.otpChallenge.findFirst({
    where: {
      phone,
      market: normalizeMarket(market),
      consumedAt: null
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function createChallenge({
  phone,
  market,
  otp,
  provider,
  providerReference = null,
  metadata = {}
}) {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpChallenge.create({
    data: {
      phone,
      market: normalizeMarket(market),
      codeHash: hashOtp({ phone, otp }),
      provider,
      providerReference,
      metadataJson: JSON.stringify(metadata || {}),
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt
    }
  });

  return { expiresAt };
}

async function sendOtpThroughOtpiq({ phone, otp }) {
  if (!OTPIQ_API_KEY) {
    return {
      ok: false,
      message: 'OTPIQ is not configured. Missing OTPIQ_API_KEY.'
    };
  }

  const client = new OTPiqClient({ apiKey: OTPIQ_API_KEY });
  const phoneNumber = phoneForOtpiq(phone);

  try {
    const response = await client.sendSMS({
      phoneNumber,
      smsType: 'verification',
      verificationCode: otp,
      provider: OTPIQ_PRIMARY_PROVIDER
    });

    return {
      ok: true,
      provider: `otpiq:${OTPIQ_PRIMARY_PROVIDER}`,
      externalId: response?.smsId || null,
      metadata: response || {}
    };
  } catch (primaryError) {
    if (!OTPIQ_FALLBACK_PROVIDER || OTPIQ_FALLBACK_PROVIDER === OTPIQ_PRIMARY_PROVIDER) {
      return {
        ok: false,
        message: primaryError?.message || 'OTPIQ OTP sending failed'
      };
    }

    try {
      const fallbackResponse = await client.sendSMS({
        phoneNumber,
        smsType: 'verification',
        verificationCode: otp,
        provider: OTPIQ_FALLBACK_PROVIDER
      });

      return {
        ok: true,
        provider: `otpiq:${OTPIQ_FALLBACK_PROVIDER}`,
        externalId: fallbackResponse?.smsId || null,
        fallbackUsed: true,
        metadata: fallbackResponse || {}
      };
    } catch (fallbackError) {
      return {
        ok: false,
        message: fallbackError?.message || primaryError?.message || 'OTPIQ OTP sending failed'
      };
    }
  }
}

async function d7Fetch(path, body) {
  const response = await fetch(`${D7_BASE_URL.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${D7_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.detail ||
      payload?.error ||
      payload?.errors ||
      `D7 API request failed with status ${response.status}`;

    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return payload;
}

function extractD7OtpId(payload) {
  return (
    payload?.otp_id ||
    payload?.otpId ||
    payload?.data?.otp_id ||
    payload?.data?.otpId ||
    payload?.data?.id ||
    payload?.id ||
    null
  );
}

async function sendOtpThroughD7Verify({ phone }) {
  if (!D7_API_TOKEN) {
    return {
      ok: false,
      message: 'D7 is not configured. Missing D7_API_TOKEN.'
    };
  }

  try {
    const payload = await d7Fetch('/verify/v1/otp/send-otp', {
      originator: D7_ORIGINATOR,
      recipient: phoneForD7(phone),
      content: D7_CONTENT_TEMPLATE,
      expiry: String(D7_EXPIRY_SECONDS),
      data_coding: 'text'
    });

    const otpId = extractD7OtpId(payload);

    if (!otpId) {
      return {
        ok: false,
        message: 'D7 OTP was sent but otp_id was missing from the response.'
      };
    }

    return {
      ok: true,
      provider: 'd7:verify',
      externalId: otpId,
      metadata: payload
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'D7 OTP sending failed'
    };
  }
}

async function verifyOtpThroughD7Verify({ otpId, otp }) {
  if (!D7_API_TOKEN) {
    return {
      ok: false,
      message: 'D7 is not configured. Missing D7_API_TOKEN.'
    };
  }

  try {
    const payload = await d7Fetch('/verify/v1/otp/verify-otp', {
      otp_id: otpId,
      otp_code: Number(String(otp).trim())
    });

    return {
      ok: true,
      metadata: payload
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'Incorrect OTP. Please try again.'
    };
  }
}

async function sendOtpThroughProvider({ phone, otp, market }) {
  const provider = providerForMarket(market);

  if (provider === 'test') {
    return {
      ok: true,
      provider: 'test'
    };
  }

  if (provider === 'otpiq') {
    return sendOtpThroughOtpiq({ phone, otp });
  }

  if (provider === 'd7') {
    return sendOtpThroughD7Verify({ phone });
  }

  return {
    ok: false,
    message: `Unsupported OTP provider for market: ${provider}`
  };
}

export function otpConfig() {
  return {
    provider: OTP_PROVIDER,
    iqProvider: IQ_OTP_PROVIDER,
    aeProvider: AE_OTP_PROVIDER,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    resendSeconds: OTP_RESEND_SECONDS,
    maxAttempts: OTP_MAX_ATTEMPTS
  };
}

export async function sendLoginOtp(phone, market = 'IQ') {
  if (!phone) {
    return { ok: false, message: 'Phone is required' };
  }

  const normalizedMarket = normalizeMarket(market);
  const provider = providerForMarket(normalizedMarket);
  const isAllowedTestOtp = isAllowedTestOtpPhone(phone);
  const active = await latestActiveChallenge(phone, normalizedMarket);

  if (active && active.expiresAt > new Date()) {
    const secondsSinceCreated = Math.floor((Date.now() - active.createdAt.getTime()) / 1000);
    const waitSeconds = OTP_RESEND_SECONDS - secondsSinceCreated;

    if (waitSeconds > 0) {
      return {
        ok: false,
        message: `Please wait ${waitSeconds} seconds before requesting another OTP.`
      };
    }
  }

  const otp = provider === 'test' || isAllowedTestOtp ? TEST_OTP : generateOtp();

  const sendResult = isAllowedTestOtp
    ? { ok: true, provider: 'test-allowed' }
    : await sendOtpThroughProvider({
        phone,
        otp,
        market: normalizedMarket
      });

  if (!sendResult.ok) {
    return sendResult;
  }

  await createChallenge({
    phone,
    market: normalizedMarket,
    otp: provider === 'd7' ? `D7:${sendResult.externalId}` : otp,
    provider: sendResult.provider || provider,
    providerReference: sendResult.externalId || null,
    metadata: sendResult.metadata || {}
  });

  return {
    ok: true,
    provider: sendResult.provider || provider,
    message: provider === 'test' ? 'Test OTP is ready' : 'OTP sent',
    expiresInMinutes: OTP_EXPIRY_MINUTES
  };
}

export async function verifyLoginOtp({ phone, otp, market = 'IQ' }) {
  if (!phone) return { ok: false, message: 'Phone is required' };
  if (!otp) return { ok: false, message: 'OTP is required' };

  const normalizedMarket = normalizeMarket(market);
  const activeProvider = providerForMarket(normalizedMarket);

  if (activeProvider === 'test' && String(otp).trim() === TEST_OTP) {
    const active = await latestActiveChallenge(phone, normalizedMarket);

    if (active && active.consumedAt === null) {
      await prisma.otpChallenge.update({
        where: { id: active.id },
        data: { consumedAt: new Date() }
      }).catch(() => {});
    }

    return { ok: true };
  }

  const challenge = await latestActiveChallenge(phone, normalizedMarket);

  if (!challenge) {
    return { ok: false, message: 'OTP has expired. Please request a new code.' };
  }

  if (challenge.expiresAt <= new Date()) {
    return { ok: false, message: 'OTP has expired. Please request a new code.' };
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return { ok: false, message: 'Too many OTP attempts. Please request a new code.' };
  }

  if (challenge.provider === 'd7:verify') {
    if (!challenge.providerReference) {
      return { ok: false, message: 'OTP has expired. Please request a new code.' };
    }

    const d7Result = await verifyOtpThroughD7Verify({
      otpId: challenge.providerReference,
      otp
    });

    if (!d7Result.ok) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } }
      });

      return { ok: false, message: d7Result.message || 'Incorrect OTP. Please try again.' };
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        consumedAt: new Date(),
        metadataJson: JSON.stringify({
          ...(JSON.parse(challenge.metadataJson || '{}')),
          verify: d7Result.metadata || {}
        })
      }
    });

    return { ok: true };
  }

  const expectedHash = hashOtp({ phone, otp });
  const isValid = expectedHash === challenge.codeHash;

  if (!isValid) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } }
    });

    return { ok: false, message: 'Incorrect OTP. Please try again.' };
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() }
  });

  return { ok: true };
}
