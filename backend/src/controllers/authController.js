import { prisma } from '../db.js';
import { signToken } from '../middleware/auth.js';

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

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { supplier: true } });
  res.json({ user });
}
