import { prisma } from '../db.js';
import { writeAuditLog } from '../services/auditService.js';

const ALLOWED_STATUSES = ['WAITING_PICKUP', 'DELIVERING', 'COMPLETED', 'CANCELLED'];

function sanitizeOrderForRole(order, role) {
  if (role !== 'SUPPLIER') return order;
  if (order.offer?.request) {
    const { customerPhone, location, customer, ...safeRequest } = order.offer.request;
    return { ...order, offer: { ...order.offer, request: safeRequest } };
  }
  return order;
}

export async function myOrders(req, res) {
  let where = { customerId: req.user.id };

  if (req.user.role === 'SUPPLIER') {
    const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
    if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });
    where = { supplierId: supplier.id };
  }

  if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) where = {};

  const orders = await prisma.order.findMany({
    where,
    include: { offer: { include: { request: true, supplier: true } } },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ orders: orders.map(order => sanitizeOrderForRole(order, req.user.role)) });
}

export async function updateOrderStatus(req, res) {
  const status = req.body.status;
  if (!ALLOWED_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid order status' });
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({ message: 'Only Admin can update order status' });

  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Order not found' });

  const order = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { offer: true }
    });

    if (status === 'COMPLETED') {
      await tx.partRequest.update({
        where: { id: updatedOrder.offer.requestId },
        data: { status: 'COMPLETED' }
      });
    }

    if (status === 'CANCELLED') {
      await tx.partRequest.update({
        where: { id: updatedOrder.offer.requestId },
        data: { status: 'CANCELLED' }
      });
    }

    return updatedOrder;
  });

  await writeAuditLog({ actorUserId: req.user.id, action: 'ORDER_STATUS_UPDATED', entityType: 'Order', entityId: order.id, metadata: { from: existing.status, to: status } });
  res.json({ order });
}

export async function updatePayment(req, res) {
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Order not found' });

  const order = await prisma.order.update({
    where: { id: existing.id },
    data: {
      paymentMethod: req.body.paymentMethod ?? existing.paymentMethod,
      paymentStatus: req.body.paymentStatus ?? existing.paymentStatus
    }
  });

  await writeAuditLog({ actorUserId: req.user.id, action: 'ORDER_PAYMENT_UPDATED', entityType: 'Order', entityId: order.id, metadata: { paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus } });
  res.json({ order });
}

export async function updateDelivery(req, res) {
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Order not found' });

  const order = await prisma.order.update({
    where: { id: existing.id },
    data: {
      driverName: req.body.driverName ?? existing.driverName,
      driverPhone: req.body.driverPhone ?? existing.driverPhone,
      pickupEta: req.body.pickupEta ?? existing.pickupEta,
      deliveryEta: req.body.deliveryEta ?? existing.deliveryEta,
      proofOfDeliveryUrl: req.body.proofOfDeliveryUrl ?? existing.proofOfDeliveryUrl,
      deliveryNotes: req.body.deliveryNotes ?? existing.deliveryNotes
    }
  });

  await writeAuditLog({ actorUserId: req.user.id, action: 'ORDER_DELIVERY_UPDATED', entityType: 'Order', entityId: order.id });
  res.json({ order });
}
