import { prisma } from '../db.js';
import { writeAuditLog } from '../services/auditService.js';

function normalizeSupportedMakes(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export async function dashboard(req, res) {
  const [orders, suppliers, requests] = await Promise.all([
    prisma.order.findMany({
      include: { offer: { include: { request: true, supplier: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.supplier.findMany({ include: { user: true, orders: true }, orderBy: { createdAt: 'desc' } }),
    prisma.partRequest.count()
  ]);
  const nonCancelledOrders = orders.filter(o => o.status !== 'CANCELLED');
  const completed = orders.filter(o => o.status === 'COMPLETED');
  const platformRevenue = completed.reduce((s, o) => s + o.platformRevenue, 0);
  const supplierEarnings = completed.reduce((s, o) => s + o.supplierPrice, 0);
  const summary = { totalOrders: orders.length, activeOrders: nonCancelledOrders.length, totalRequests: requests, suppliers: suppliers.length };
  if (req.user.role === 'SUPER_ADMIN') {
    summary.platformRevenue = platformRevenue;
    summary.supplierEarnings = supplierEarnings;
  }
  res.json({ summary, orders, suppliers });
}

export async function auditLogs(req, res) {
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json({ logs });
}

export async function createSupplier(req, res) {
  const { name, phone, location, supportedMakes } = req.body;
  if (!name || !phone || !location) return res.status(400).json({ message: 'Name, phone, and location are required' });

  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, role: 'SUPPLIER' },
    create: { name, phone, role: 'SUPPLIER' }
  });
  const supplier = await prisma.supplier.upsert({
    where: { userId: user.id },
    update: { name, phone, location, isActive: true, supportedMakesJson: JSON.stringify(normalizeSupportedMakes(supportedMakes)) },
    create: { userId: user.id, name, phone, location, supportedMakesJson: JSON.stringify(normalizeSupportedMakes(supportedMakes)) }
  });
  await writeAuditLog({ actorUserId: req.user.id, action: 'SUPPLIER_CREATED', entityType: 'Supplier', entityId: supplier.id, metadata: { phone, location } });
  res.status(201).json({ supplier });
}

export async function updateSupplier(req, res) {
  const { name, phone, location, supportedMakes, isActive } = req.body;
  const existing = await prisma.supplier.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Supplier not found' });

  const supplier = await prisma.supplier.update({
    where: { id: existing.id },
    data: {
      name: name ?? existing.name,
      phone: phone ?? existing.phone,
      location: location ?? existing.location,
      isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
      supportedMakesJson: supportedMakes ? JSON.stringify(normalizeSupportedMakes(supportedMakes)) : existing.supportedMakesJson
    }
  });

  if (name || phone) {
    await prisma.user.update({ where: { id: existing.userId }, data: { name: name ?? existing.name, phone: phone ?? existing.phone } });
  }

  await writeAuditLog({ actorUserId: req.user.id, action: 'SUPPLIER_UPDATED', entityType: 'Supplier', entityId: supplier.id, metadata: { isActive: supplier.isActive } });
  res.json({ supplier });
}

export async function disableSupplier(req, res) {
  const existing = await prisma.supplier.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Supplier not found' });
  const supplier = await prisma.supplier.update({ where: { id: existing.id }, data: { isActive: false } });
  await writeAuditLog({ actorUserId: req.user.id, action: 'SUPPLIER_DISABLED', entityType: 'Supplier', entityId: supplier.id });
  res.json({ supplier });
}
