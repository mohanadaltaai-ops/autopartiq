import crypto from 'crypto';
import { OTPiqClient } from 'otpiq';
import { prisma } from '../db.js';

const OTP_PROVIDER = process.env.OTP_PROVIDER || 'test';
const TEST_OTP = process.env.TEST_OTP || '1234';
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'local-otp-secret';

const IQ_OTP_PROVIDER = process.env.IQ_OTP_PROVIDER || 'test';
const AE_OTP_PROVIDER = process.env.AE_OTP_PROVIDER || 'test';

const OTPIQ_API_KEY = process.env.OTPIQ_API_KEY || '';
const OTPIQ_PRIMARY_PROVIDER = process.env.OTPIQ_PRIMARY_PROVIDER || 'whatsapp';
const OTPIQ_FALLBACK_PROVIDER = process.env.OTPIQ_FALLBACK_PROVIDER || 'sms';

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

function phoneForOtpiq(phone) {
  return String(phone || '').replace(/^\+/, '');
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

async function createChallenge({ phone, market, otp, provider }) {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpChallenge.create({
    data: {
      phone,
      market: normalizeMarket(market),
      codeHash: hashOtp({ phone, otp }),
      provider,
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

  const client = new OTPiqClient({
    apiKey: OTPIQ_API_KEY
  });

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
      externalId: response?.smsId || null
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
        fallbackUsed: true
      };
    } catch (fallbackError) {
      return {
        ok: false,
        message: fallbackError?.message || primaryError?.message || 'OTPIQ OTP sending failed'
      };
    }
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

  return {
    ok: false,
    message: `Unsupported OTP provider for market: ${provider}`
  };
}

export function otpConfig() {
  return {
    provider: OTP_PROVIDER,
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

  const provider = providerForMarket(normalizedMarket);
  const otp = provider === 'test' ? TEST_OTP : generateOtp();

  const sendResult = await sendOtpThroughProvider({
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
    otp,
    provider: sendResult.provider || provider
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

  // Keep direct local/test login working even if the request-OTP step was skipped.
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
