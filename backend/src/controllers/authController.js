import { prisma } from '../db.js';
import { signToken } from '../middleware/auth.js';

const EMERGENCY_SUPERADMIN_USERNAME = process.env.EMERGENCY_SUPERADMIN_USERNAME || 'superadmin';
const EMERGENCY_SUPERADMIN_PASSWORD = process.env.EMERGENCY_SUPERADMIN_PASSWORD;
const ADMIN_PERMISSIONS = ['FULL_ADMIN', 'ORDERS_ONLY'];
const ENROLLABLE_ROLES = ['ADMIN', 'SUPER_ADMIN'];

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
