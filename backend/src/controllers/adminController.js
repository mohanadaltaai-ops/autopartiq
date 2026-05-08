import { prisma } from '../db.js';
import { writeAuditLog } from '../services/auditService.js';

function normalizeSupportedMakes(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeMarketInput(value) {
  return value === 'AE' ? 'AE' : 'IQ';
}

function resolveAdminMarketWhere(req) {
  if (req.user.role === 'SUPER_ADMIN') {
    const requestedMarket = String(req.query.market || 'ALL').toUpperCase();
    if (requestedMarket === 'IQ' || requestedMarket === 'AE') return { market: requestedMarket };
    return {};
  }

  return { market: req.user.market || 'IQ' };
}

function resolveWritableMarket(req, requestedMarket) {
  if (req.user.role === 'SUPER_ADMIN') return normalizeMarketInput(requestedMarket);
  return req.user.market || 'IQ';
}

export async function dashboard(req, res) {
  const marketWhere = resolveAdminMarketWhere(req);

  const [orders, suppliers, requests] = await Promise.all([
    prisma.order.findMany({
      where: marketWhere,
      include: { offer: { include: { request: true, supplier: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.supplier.findMany({ where: marketWhere, include: { user: true, orders: true }, orderBy: { createdAt: 'desc' } }),
    prisma.partRequest.count({ where: marketWhere })
  ]);

  const activeOperationalOrders = orders.filter(o => ['WAITING_PICKUP', 'DELIVERING'].includes(o.status));
  const waitingPickupOrders = orders.filter(o => o.status === 'WAITING_PICKUP');
  const deliveringOrders = orders.filter(o => o.status === 'DELIVERING');
  const completed = orders.filter(o => o.status === 'COMPLETED');
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');
  const pendingPayments = orders.filter(o => o.paymentStatus === 'PENDING');
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const activeSuppliers = suppliers.filter(s => s.isActive);
  const platformRevenue = completed.reduce((s, o) => s + o.platformRevenue, 0);
  const supplierEarnings = completed.reduce((s, o) => s + o.supplierPrice, 0);

  const summary = {
    totalOrders: orders.length,
    activeOrders: activeOperationalOrders.length,
    waitingPickupOrders: waitingPickupOrders.length,
    deliveringOrders: deliveringOrders.length,
    completedOrders: completed.length,
    cancelledOrders: cancelledOrders.length,
    pendingPayments: pendingPayments.length,
    paidOrders: paidOrders.length,
    requests: requests.length,
    suppliers: suppliers.length,
    activeSuppliers: activeSuppliers.length,
    market: req.user.role === 'SUPER_ADMIN' ? String(req.query.market || 'ALL').toUpperCase() : (req.user.market || 'IQ')
  };

  if (req.user.role === 'SUPER_ADMIN') {
    summary.platformRevenue = platformRevenue;
    summary.supplierEarnings = supplierEarnings;
  }

  res.json({ summary, orders, suppliers });
}

function auditLogMatchesMarket(log, market) {
  if (!market || market === 'ALL') return true;

  if ((log.actor?.market || 'IQ') === market) return true;

  try {
    const metadata = JSON.parse(log.metadataJson || '{}');
    if ((metadata.market || 'IQ') === market) return true;
  } catch {
    // Ignore invalid metadata and fall back to actor market only.
  }

  return false;
}

export async function auditLogs(req, res) {
  const requestedMarket = req.user.role === 'SUPER_ADMIN'
    ? String(req.query.market || 'ALL').toUpperCase()
    : (req.user.market || 'IQ');

  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: requestedMarket === 'ALL' ? 100 : 300
  });

  const filteredLogs = logs
    .filter(log => auditLogMatchesMarket(log, requestedMarket))
    .slice(0, 100);

  res.json({ logs: filteredLogs });
}

export async function createAdminUser(req, res) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Only Super Admin can manage admin users' });
  }

  const { name, phone, email, username, password, role, adminPermission, market } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  const nextRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
  const nextPermission =
    nextRole === 'ADMIN' && adminPermission === 'ORDERS_ONLY'
      ? 'ORDERS_ONLY'
      : 'FULL_ADMIN';
  const nextMarket = resolveWritableMarket(req, market);

  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      name,
      phone,
      email: email || null,
      username: username || null,
      password: password || null,
      role: nextRole,
      adminPermission: nextPermission,
      market: nextMarket
    },
    create: {
      name,
      phone,
      email: email || null,
      username: username || null,
      password: password || null,
      role: nextRole,
      adminPermission: nextPermission,
      market: nextMarket
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
      adminPermission: nextPermission,
      market: nextMarket
    }
  });

  res.status(201).json({ user });
}

export async function createSupplier(req, res) {
  const { name, phone, location, supportedMakes, market } = req.body;

  if (!name || !phone || !location) {
    return res.status(400).json({ message: 'Name, phone, and location are required' });
  }

  const supplierMarket = resolveWritableMarket(req, market);

  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, role: 'SUPPLIER', market: supplierMarket },
    create: { name, phone, role: 'SUPPLIER', market: supplierMarket }
  });

  const supplier = await prisma.supplier.upsert({
    where: { userId: user.id },
    update: {
      name,
      phone,
      location,
      isActive: true,
      market: supplierMarket,
      supportedMakesJson: JSON.stringify(normalizeSupportedMakes(supportedMakes))
    },
    create: {
      userId: user.id,
      name,
      phone,
      location,
      market: supplierMarket,
      supportedMakesJson: JSON.stringify(normalizeSupportedMakes(supportedMakes))
    }
  });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'SUPPLIER_CREATED',
    entityType: 'Supplier',
    entityId: supplier.id,
    metadata: { phone, location, market: supplierMarket }
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


export async function listAdminUsers(req, res) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Only Super Admin can manage admin users' });
  }

  const marketWhere = resolveAdminMarketWhere(req);

  const users = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      ...marketWhere
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      username: true,
      role: true,
      adminPermission: true,
      market: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ users });
}

export async function updateAdminUser(req, res) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Only Super Admin can manage admin users' });
  }

  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing || !['ADMIN', 'SUPER_ADMIN'].includes(existing.role)) {
    return res.status(404).json({ message: 'Admin user not found' });
  }

  const { name, phone, email, username, role, adminPermission, market } = req.body;
  const nextRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
  const nextPermission =
    nextRole === 'ADMIN' && adminPermission === 'ORDERS_ONLY'
      ? 'ORDERS_ONLY'
      : 'FULL_ADMIN';
  const nextMarket = resolveWritableMarket(req, market);

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      name: name ?? existing.name,
      phone: phone ?? existing.phone,
      email: email === '' ? null : (email ?? existing.email),
      username: username === '' ? null : (username ?? existing.username),
      role: nextRole,
      adminPermission: nextPermission,
      market: nextMarket
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      username: true,
      role: true,
      adminPermission: true,
      market: true,
      createdAt: true
    }
  });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'ADMIN_USER_UPDATED',
    entityType: 'User',
    entityId: user.id,
    metadata: { phone: user.phone, role: user.role, adminPermission: user.adminPermission, market: user.market }
  });

  res.json({ user });
}

export async function disableAdminUser(req, res) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Only Super Admin can manage admin users' });
  }

  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot disable your own account' });
  }

  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing || !['ADMIN', 'SUPER_ADMIN'].includes(existing.role)) {
    return res.status(404).json({ message: 'Admin user not found' });
  }

  const disabledPhone = existing.phone.startsWith('disabled:')
    ? existing.phone
    : `disabled:${existing.id}:${existing.phone}`;

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      phone: disabledPhone,
      username: existing.username ? `disabled:${existing.id}:${existing.username}` : null,
      password: null
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      username: true,
      role: true,
      adminPermission: true,
      market: true,
      createdAt: true
    }
  });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'ADMIN_USER_DISABLED',
    entityType: 'User',
    entityId: user.id,
    metadata: { market: user.market }
  });

  res.json({ user });
}
