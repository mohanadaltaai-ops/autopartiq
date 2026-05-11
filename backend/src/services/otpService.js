import crypto from 'crypto';
import { prisma } from '../db.js';

const OTP_PROVIDER = process.env.OTP_PROVIDER || 'test';
const TEST_OTP = process.env.TEST_OTP || '1234';
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'local-otp-secret';

function normalizeMarket(market) {
  return market === 'AE' ? 'AE' : 'IQ';
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

async function sendSmsThroughProvider({ phone, otp }) {
  // Provider integration will be added in the next batch after we choose the SMS provider.
  // This function intentionally does not log the OTP.
  return {
    ok: false,
    message: 'SMS OTP provider is not configured yet'
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

  if (OTP_PROVIDER === 'test') {
    await createChallenge({
      phone,
      market: normalizedMarket,
      otp: TEST_OTP,
      provider: 'test'
    });

    return {
      ok: true,
      provider: 'test',
      message: 'Test OTP is ready',
      expiresInMinutes: OTP_EXPIRY_MINUTES
    };
  }

  if (OTP_PROVIDER === 'sms') {
    const otp = generateOtp();
    const smsResult = await sendSmsThroughProvider({ phone, otp, market: normalizedMarket });

    if (!smsResult.ok) {
      return smsResult;
    }

    await createChallenge({
      phone,
      market: normalizedMarket,
      otp,
      provider: 'sms'
    });

    return {
      ok: true,
      provider: 'sms',
      message: 'OTP sent',
      expiresInMinutes: OTP_EXPIRY_MINUTES
    };
  }

  return { ok: false, message: 'Unsupported OTP provider' };
}

export async function verifyLoginOtp({ phone, otp, market = 'IQ' }) {
  if (!phone) return { ok: false, message: 'Phone is required' };
  if (!otp) return { ok: false, message: 'OTP is required' };

  const normalizedMarket = normalizeMarket(market);

  // Keep direct local/test login working even if the request-OTP step was skipped.
  if (OTP_PROVIDER === 'test' && String(otp).trim() === TEST_OTP) {
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
