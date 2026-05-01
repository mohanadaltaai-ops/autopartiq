import { prisma } from '../db.js';

export async function dashboard(req, res) {
  const [orders, suppliers, requests] = await Promise.all([
    prisma.order.findMany({ include: { offer: { include: { request: true, supplier: true } } } }),
    prisma.supplier.findMany({ include: { user: true, orders: true } }),
    prisma.partRequest.count()
  ]);
  const completed = orders.filter(o => o.status === 'COMPLETED');
  const platformRevenue = completed.reduce((s, o) => s + o.platformRevenue, 0);
  const supplierEarnings = orders.reduce((s, o) => s + o.supplierPrice, 0);
  res.json({ summary: { totalOrders: orders.length, totalRequests: requests, suppliers: suppliers.length, platformRevenue, supplierEarnings }, orders, suppliers });
}

export async function createSupplier(req, res) {
  const { name, phone, location, supportedMakes } = req.body;
  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, role: 'SUPPLIER' },
    create: { name, phone, role: 'SUPPLIER' }
  });
  const supplier = await prisma.supplier.upsert({
    where: { userId: user.id },
    update: { name, phone, location, supportedMakesJson: JSON.stringify(supportedMakes || []) },
    create: { userId: user.id, name, phone, location, supportedMakesJson: JSON.stringify(supportedMakes || []) }
  });
  res.status(201).json({ supplier });
}
