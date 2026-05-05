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
  const waitingPickupOrders = orders.filter(o => o.status === 'WAITING_PICKUP');
  const deliveringOrders = orders.filter(o => o.status === 'DELIVERING');
  const completed = orders.filter(o => o.status === 'COMPLETED');
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');
  const pendingPayments = orders.filter(o => o.paymentStatus === 'PENDING');
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const activeSuppliers = suppliers.filter(s => s.isActive);
  const platformRevenue = completed.reduce((s, o) => s + o.platformRevenue, 0);

  const summary = {
    totalOrders: orders.length,
    activeOrders: nonCancelledOrders.length,
    waitingPickupOrders: waitingPickupOrders.length,
    deliveringOrders: deliveringOrders.length,
    completedOrders: completed.length,
    cancelledOrders: cancelledOrders.length,
    pendingPayments: pendingPayments.length,
    paidOrders: paidOrders.length,
    requests: requests.length,
    suppliers: suppliers.length,
    activeSuppliers: activeSuppliers.length
  };

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

export async function createAdminUser(req, res) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Only Super Admin can manage admin users' });
  }

  const { name, phone, email, role, adminPermission } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  const nextRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
  const nextPermission =
    nextRole === 'ADMIN' && adminPermission === 'ORDERS_ONLY'
      ? 'ORDERS_ONLY'
      : 'FULL_ADMIN';

  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      name,
      phone,
      email: email || null,
      role: nextRole,
      adminPermission: nextPermission
    },
    create: {
      name,
      phone,
      email: email || null,
      role: nextRole,
      adminPermission: nextPermission
    }
  });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'ADMIN_USER_CREATED',
    entityType: 'User',
    entityId: user.id,
    metadata: {
      phone,
      role: nextRole,
      adminPermission: nextPermission
    }
  });

  res.status(201).json({ user });
}

export async function createSupplier(req, res) {
  const { name, phone, location, supportedMakes } = req.body;

  if (!name || !phone || !location) {
    return res.status(400).json({ message: 'Name, phone, and location are required' });
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, role: 'SUPPLIER' },
    create: { name, phone, role: 'SUPPLIER' }
  });

  const supplier = await prisma.supplier.upsert({
    where: { userId: user.id },
    update: {
      name,
      phone,
      location,
      isActive: true,
      supportedMakesJson: JSON.stringify(normalizeSupportedMakes(supportedMakes))
    },
    create: {
      userId: user.id,
      name,
      phone,
      location,
      supportedMakesJson: JSON.stringify(normalizeSupportedMakes(supportedMakes))
    }
  });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'SUPPLIER_CREATED',
    entityType: 'Supplier',
    entityId: supplier.id,
    metadata: { phone, location }
  });

  res.status(201).json({ supplier });
}

export async function updateSupplier(req, res) {
  const { name, phone, location, supportedMakes, isActive } = req.body;
  const existing = await prisma.supplier.findUnique({ where: { id: req.params.id } });

  if (!existing) {
    return res.status(404).json({ message: 'Supplier not found' });
  }

  const supplier = await prisma.supplier.update({
    where: { id: existing.id },
    data: {
      name: name ?? existing.name,
      phone: phone ?? existing.phone,
      location: location ?? existing.location,
      isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
      supportedMakesJson: supportedMakes
        ? JSON.stringify(normalizeSupportedMakes(supportedMakes))
        : existing.supportedMakesJson
    }
  });

  if (name || phone) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        name: name ?? existing.name,
        phone: phone ?? existing.phone
      }
    });
  }

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'SUPPLIER_UPDATED',
    entityType: 'Supplier',
    entityId: supplier.id,
    metadata: { isActive: supplier.isActive }
  });

  res.json({ supplier });
}

export async function disableSupplier(req, res) {
  const existing = await prisma.supplier.findUnique({ where: { id: req.params.id } });

  if (!existing) {
    return res.status(404).json({ message: 'Supplier not found' });
  }

  const supplier = await prisma.supplier.update({
    where: { id: existing.id },
    data: { isActive: false }
  });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'SUPPLIER_DISABLED',
    entityType: 'Supplier',
    entityId: supplier.id
  });

  res.json({ supplier });
}
