import { prisma } from '../db.js';

export async function myOrders(req, res) {
  let where = { customerId: req.user.id };
  if (req.user.role === 'SUPPLIER') {
    const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
    where = { supplierId: supplier?.id };
  }
  if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) where = {};
  const orders = await prisma.order.findMany({ where, include: { offer: { include: { request: true, supplier: true } } }, orderBy: { createdAt: 'desc' } });
  res.json({ orders });
}

export async function updateOrderStatus(req, res) {
  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: req.body.status } });
  res.json({ order });
}
