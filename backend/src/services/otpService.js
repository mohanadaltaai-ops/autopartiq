const OTP_PROVIDER = process.env.OTP_PROVIDER || 'test';
const TEST_OTP = process.env.TEST_OTP || '1234';
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

export function otpConfig() {
  return {
    provider: OTP_PROVIDER,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    resendSeconds: OTP_RESEND_SECONDS,
    maxAttempts: OTP_MAX_ATTEMPTS
  };
}

export async function sendLoginOtp(phone) {
  if (!phone) {
    return { ok: false, message: 'Phone is required' };
  }

  if (OTP_PROVIDER === 'test') {
    return {
      ok: true,
      provider: 'test',
      message: 'Test OTP is ready',
      expiresInMinutes: OTP_EXPIRY_MINUTES
    };
  }

  if (OTP_PROVIDER === 'sms') {
    // Future production integration point:
    // 1. Generate a random OTP
    // 2. Store hashed OTP + expiry + attempt count
    // 3. Send OTP through SMS provider
    // 4. Return a generic success response
    return {
      ok: false,
      message: 'SMS OTP provider is not configured yet'
    };
  }

  return { ok: false, message: 'Unsupported OTP provider' };
}

export async function verifyLoginOtp({ phone, otp }) {
  if (!phone) return { ok: false, message: 'Phone is required' };
  if (!otp) return { ok: false, message: 'OTP is required' };

  if (OTP_PROVIDER === 'test') {
    if (String(otp).trim() === TEST_OTP) {
      return { ok: true };
    }

    return { ok: false, message: 'Incorrect OTP. Please try again.' };
  }

  if (OTP_PROVIDER === 'sms') {
    // Future production integration point:
    // 1. Load OTP challenge by phone
    // 2. Check expiry
    // 3. Check attempt limit
    // 4. Compare hashed OTP
    // 5. Mark OTP as used
    return {
      ok: false,
      message: 'SMS OTP verification is not configured yet'
    };
  }

  return { ok: false, message: 'Unsupported OTP provider' };
}
