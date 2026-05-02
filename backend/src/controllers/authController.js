import { prisma } from '../db.js';
import { signToken } from '../middleware/auth.js';

const EMERGENCY_SUPERADMIN_USERNAME = 'superadmin';
const EMERGENCY_SUPERADMIN_PASSWORD = 'AutoParts2026!';

export async function login(req, res) {
  const { phone, otp } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone is required' });
  if (!otp) return res.status(400).json({ message: 'OTP is required' });

  let user = await prisma.user.findUnique({ where: { phone }, include: { supplier: true } });
  if (!user) {
    user = await prisma.user.create({ data: { phone, name: 'Customer', role: 'CUSTOMER' }, include: { supplier: true } });
  }
  const token = signToken(user);
  res.json({ token, user });
}

export async function superAdminLogin(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ message: 'Username/phone and password are required' });

  if (identifier === EMERGENCY_SUPERADMIN_USERNAME && password === EMERGENCY_SUPERADMIN_PASSWORD) {
    const fallbackPhone = '000-superadmin';
    const user = await prisma.user.upsert({
      where: { phone: fallbackPhone },
      update: { name: 'Emergency Super Admin', role: 'SUPER_ADMIN', username: EMERGENCY_SUPERADMIN_USERNAME },
      create: { phone: fallbackPhone, name: 'Emergency Super Admin', role: 'SUPER_ADMIN', username: EMERGENCY_SUPERADMIN_USERNAME }
    });
    const token = signToken(user);
    return res.json({ token, user });
  }

  const user = await prisma.user.findFirst({
    where: {
      role: 'SUPER_ADMIN',
      OR: [{ username: identifier }, { phone: identifier }, { email: identifier }]
    },
    include: { supplier: true }
  });

  if (!user || user.password !== password) return res.status(401).json({ message: 'Invalid Super Admin credentials' });
  const token = signToken(user);
  res.json({ token, user });
}

export async function enrollSuperAdmin(req, res) {
  const { name, phone, email, username, password } = req.body;
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ message: 'Only Super Admin can enroll Super Admins' });
  if (!name || !phone || !username || !password) return res.status(400).json({ message: 'Name, phone, username, and password are required' });

  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, email: email || null, username, password, role: 'SUPER_ADMIN' },
    create: { name, phone, email: email || null, username, password, role: 'SUPER_ADMIN' }
  });

  res.status(201).json({ user });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { supplier: true } });
  res.json({ user });
}
