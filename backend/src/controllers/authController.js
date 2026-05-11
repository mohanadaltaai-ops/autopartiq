import { prisma } from '../db.js';
import { signToken } from '../middleware/auth.js';
import { sendLoginOtp, verifyLoginOtp } from '../services/otpService.js';

const EMERGENCY_SUPERADMIN_USERNAME = process.env.EMERGENCY_SUPERADMIN_USERNAME || 'superadmin';
const EMERGENCY_SUPERADMIN_PASSWORD = process.env.EMERGENCY_SUPERADMIN_PASSWORD;
const ADMIN_PERMISSIONS = ['FULL_ADMIN', 'ORDERS_ONLY'];
const ENROLLABLE_ROLES = ['ADMIN', 'SUPER_ADMIN'];

function normalizeMarketInput(market) {
  return market === 'AE' ? 'AE' : 'IQ';
}

function isValidPhoneForMarket(phone, market) {
  if (market === 'AE') return /^\+9715\d{8}$/.test(phone);
  return /^\+9647\d{9}$/.test(phone);
}

function normalizePhoneInput(phone) {
  const compact = String(phone || '').replace(/\s+/g, '').replace(/-/g, '');
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('00')) return `+${compact.slice(2)}`;
  if (compact.startsWith('07')) return `+964${compact.slice(1)}`;
  if (compact.startsWith('7')) return `+964${compact}`;
  if (compact.startsWith('05')) return `+971${compact.slice(1)}`;
  if (compact.startsWith('5')) return `+971${compact}`;
  return compact;
}

function legacyLocalPhoneFromNormalized(phone) {
  if (/^\+9647\d{9}$/.test(phone)) return `0${phone.slice(4)}`;
  if (/^\+9715\d{8}$/.test(phone)) return `0${phone.slice(4)}`;
  return null;
}

async function findOrMigrateUserByPhone(phone) {
  const normalizedPhone = normalizePhoneInput(phone);
  const exactUser = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
    include: { supplier: true }
  });

  if (exactUser) return { user: exactUser, phone: normalizedPhone };

  const legacyPhone = legacyLocalPhoneFromNormalized(normalizedPhone);
  if (!legacyPhone) return { user: null, phone: normalizedPhone };

  const legacyUser = await prisma.user.findUnique({
    where: { phone: legacyPhone },
    include: { supplier: true }
  });

  if (!legacyUser) return { user: null, phone: normalizedPhone };

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: legacyUser.id },
      data: { phone: normalizedPhone },
      include: { supplier: true }
    });

    if (legacyUser.supplier) {
      await tx.supplier.update({
        where: { id: legacyUser.supplier.id },
        data: { phone: normalizedPhone }
      });
    }

    return updatedUser;
  });

  return { user, phone: normalizedPhone };
}



export async function requestLoginOtp(req, res) {
  const { phone } = req.body;
  const market = normalizeMarketInput(req.body.market);
  if (!phone) return res.status(400).json({ message: 'Phone is required' });

  const normalizedPhone = normalizePhoneInput(phone);
  if (!isValidPhoneForMarket(normalizedPhone, market)) {
    return res.status(400).json({
      message: market === 'AE'
        ? 'Enter a valid UAE mobile number like +9715XXXXXXXX'
        : 'Enter a valid Iraq mobile number like +9647XXXXXXXXX'
    });
  }

  const result = await sendLoginOtp(normalizedPhone, market);
  if (!result.ok) return res.status(400).json({ message: result.message });

  res.json({ ok: true, provider: result.provider, expiresInMinutes: result.expiresInMinutes });
}

export async function login(req, res) {
  const { phone, otp } = req.body;
  const market = normalizeMarketInput(req.body.market);
  if (!phone) return res.status(400).json({ message: 'Phone is required' });
  if (!otp) return res.status(400).json({ message: 'OTP is required' });

  const normalizedPhone = normalizePhoneInput(phone);
  if (!isValidPhoneForMarket(normalizedPhone, market)) {
    return res.status(400).json({
      message: market === 'AE'
        ? 'Enter a valid UAE mobile number like +9715XXXXXXXX'
        : 'Enter a valid Iraq mobile number like +9647XXXXXXXXX'
    });
  }

  const otpResult = await verifyLoginOtp({ phone: normalizedPhone, otp, market });
  if (!otpResult.ok) return res.status(401).json({ message: otpResult.message || 'Incorrect OTP. Please try again.' });

  let { user, phone: loginPhone } = await findOrMigrateUserByPhone(normalizedPhone);

  if (user && user.market !== market) {
    return res.status(403).json({
      message: market === 'AE'
        ? 'This phone number is registered for another market. Please use the correct app.'
        : 'This phone number is registered for another market. Please use the correct app.'
    });
  }

  if (!user) {
    user = await prisma.user.create({
      data: { phone: loginPhone, name: 'Customer', role: 'CUSTOMER', market },
      include: { supplier: true }
    });
  }

  const token = signToken(user);
  res.json({ token, user });
}

export async function superAdminLogin(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ message: 'Username/phone and password are required' });

  if (EMERGENCY_SUPERADMIN_PASSWORD && identifier === EMERGENCY_SUPERADMIN_USERNAME && password === EMERGENCY_SUPERADMIN_PASSWORD) {
    const fallbackPhone = '000-superadmin';
    const user = await prisma.user.upsert({
      where: { phone: fallbackPhone },
      update: { name: 'Emergency Super Admin', role: 'SUPER_ADMIN', username: EMERGENCY_SUPERADMIN_USERNAME, adminPermission: 'FULL_ADMIN' },
      create: { phone: fallbackPhone, name: 'Emergency Super Admin', role: 'SUPER_ADMIN', username: EMERGENCY_SUPERADMIN_USERNAME, adminPermission: 'FULL_ADMIN' }
    });
    const token = signToken(user);
    return res.json({ token, user });
  }

  const user = await prisma.user.findFirst({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      OR: [{ username: identifier }, { phone: identifier }, { email: identifier }]
    },
    include: { supplier: true }
  });

  if (!user || user.password !== password) return res.status(401).json({ message: 'Invalid admin credentials' });
  const token = signToken(user);
  res.json({ token, user });
}

export async function enrollSuperAdmin(req, res) {
  const { name, phone, email, username, password } = req.body;
  const role = ENROLLABLE_ROLES.includes(req.body.role) ? req.body.role : 'SUPER_ADMIN';
  const adminPermission = ADMIN_PERMISSIONS.includes(req.body.adminPermission) ? req.body.adminPermission : 'FULL_ADMIN';

  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ message: 'Only Super Admin can enroll admins' });
  if (!name || !phone || !username || !password) return res.status(400).json({ message: 'Name, phone, username, and password are required' });

  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, email: email || null, username, password, role, adminPermission: role === 'ADMIN' ? adminPermission : 'FULL_ADMIN' },
    create: { name, phone, email: email || null, username, password, role, adminPermission: role === 'ADMIN' ? adminPermission : 'FULL_ADMIN' }
  });

  res.status(201).json({ user });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { supplier: true } });
  res.json({ user });
}
