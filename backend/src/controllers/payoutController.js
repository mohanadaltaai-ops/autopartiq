import { prisma } from '../db.js';
import { writeAuditLog } from '../services/auditService.js';

const PAYOUT_METHODS = ['CASH', 'ZAINCASH', 'MANUAL', 'OTHER'];

function resolvePayoutMarketWhere(req) {
  if (req.user.role === 'SUPER_ADMIN') {
    const requestedMarket = String(req.query.market || 'ALL').toUpperCase();
    if (requestedMarket === 'IQ' || requestedMarket === 'AE') return { market: requestedMarket };
    return {};
  }

  return { market: req.user.market || 'IQ' };
}

function canAccessPayoutMarket(req, payout) {
  if (req.user.role === 'SUPER_ADMIN') return true;
  return (payout.market || payout.supplier?.market || 'IQ') === (req.user.market || 'IQ');
}

function parsePayoutMetadata(payout) {
  if (!payout) return payout;

  let metadata = {};
  try {
    metadata = payout.metadataJson ? JSON.parse(payout.metadataJson) : {};
  } catch {
    metadata = {};
  }

  return {
    ...payout,
    metadata
  };
}

function payoutInclude() {
  return {
    supplier: { include: { user: true } },
    order: {
      include: {
        offer: {
          include: {
            request: true
          }
        }
      }
    }
  };
}

function summarizePayouts(payouts) {
  return payouts.reduce(
    (summary, payout) => {
      summary.total += payout.amount;

      if (payout.status === 'PENDING') {
        summary.pendingCount += 1;
        summary.pendingAmount += payout.amount;
      }

      if (payout.status === 'PAID') {
        summary.paidCount += 1;
        summary.paidAmount += payout.amount;
      }

      if (payout.status === 'CANCELLED') {
        summary.cancelledCount += 1;
        summary.cancelledAmount += payout.amount;
      }

      return summary;
    },
    {
      total: 0,
      pendingAmount: 0,
      paidAmount: 0,
      cancelledAmount: 0,
      pendingCount: 0,
      paidCount: 0,
      cancelledCount: 0
    }
  );
}

export async function adminPayouts(req, res) {
  const status = req.query.status;
  const where = {
    ...resolvePayoutMarketWhere(req),
    ...(status ? { status } : {})
  };

  const payouts = await prisma.supplierPayout.findMany({
    where,
    include: payoutInclude(),
    orderBy: { createdAt: 'desc' }
  });

  res.json({ payouts: payouts.map(parsePayoutMetadata) });
}

export async function adminPayoutSummary(req, res) {
  const payouts = await prisma.supplierPayout.findMany({
    where: resolvePayoutMarketWhere(req)
  });
  res.json({ summary: summarizePayouts(payouts) });
}

export async function markPayoutPaid(req, res) {
  const existing = await prisma.supplierPayout.findUnique({
    where: { id: req.params.id },
    include: payoutInclude()
  });

  if (!existing) return res.status(404).json({ message: 'Payout not found' });
  if (!canAccessPayoutMarket(req, existing)) return res.status(403).json({ message: 'This payout belongs to another market' });
  if (existing.status === 'PAID') return res.status(400).json({ message: 'Payout is already paid' });
  if (existing.status === 'CANCELLED') return res.status(400).json({ message: 'Cancelled payout cannot be paid' });

  const method = req.body.method || 'MANUAL';
  if (!PAYOUT_METHODS.includes(method)) return res.status(400).json({ message: 'Invalid payout method' });

  const payout = await prisma.supplierPayout.update({
    where: { id: existing.id },
    data: {
      status: 'PAID',
      method,
      reference: req.body.reference || existing.reference,
      notes: req.body.notes || existing.notes,
      provider: req.body.provider || existing.provider,
      providerTransactionId: req.body.providerTransactionId || existing.providerTransactionId,
      paidAt: req.body.paidAt ? new Date(req.body.paidAt) : new Date(),
      metadataJson: JSON.stringify({
        markedPaidBy: req.user.id,
        markedPaidAt: new Date().toISOString(),
        ...(req.body.metadata || {})
      })
    },
    include: payoutInclude()
  });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'SUPPLIER_PAYOUT_MARKED_PAID',
    entityType: 'SupplierPayout',
    entityId: payout.id,
    metadata: {
      supplierId: payout.supplierId,
      orderId: payout.orderId,
      amount: payout.amount,
      method: payout.method,
      reference: payout.reference
    }
  });

  if (payout.supplier?.userId) {
    await prisma.notification.create({
      data: {
        userId: payout.supplier.userId,
        message: `Supplier payout marked as paid: ${payout.amount}`,
        metadataJson: JSON.stringify({
          type: 'SUPPLIER_PAYOUT_PAID',
          payoutId: payout.id,
          orderId: payout.orderId,
          amount: payout.amount,
          method: payout.method,
          tab: 'earnings'
        })
      }
    });
  }

  res.json({ payout: parsePayoutMetadata(payout) });
}

export async function cancelPayout(req, res) {
  const existing = await prisma.supplierPayout.findUnique({
    where: { id: req.params.id },
    include: payoutInclude()
  });

  if (!existing) return res.status(404).json({ message: 'Payout not found' });
  if (existing.status === 'PAID') return res.status(400).json({ message: 'Paid payout cannot be cancelled' });
  if (existing.status === 'CANCELLED') return res.status(400).json({ message: 'Payout is already cancelled' });

  const payout = await prisma.supplierPayout.update({
    where: { id: existing.id },
    data: {
      status: 'CANCELLED',
      notes: req.body.notes || existing.notes,
      metadataJson: JSON.stringify({
        cancelledBy: req.user.id,
        cancelledAt: new Date().toISOString(),
        reason: req.body.reason || null
      })
    },
    include: payoutInclude()
  });

  await writeAuditLog({
    actorUserId: req.user.id,
    action: 'SUPPLIER_PAYOUT_CANCELLED',
    entityType: 'SupplierPayout',
    entityId: payout.id,
    metadata: {
      supplierId: payout.supplierId,
      orderId: payout.orderId,
      amount: payout.amount,
      reason: req.body.reason || null
    }
  });

  res.json({ payout: parsePayoutMetadata(payout) });
}

export async function supplierPayouts(req, res) {
  const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
  if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

  const status = req.query.status;
  const where = {
    supplierId: supplier.id,
    ...(status ? { status } : {})
  };

  const payouts = await prisma.supplierPayout.findMany({
    where,
    include: payoutInclude(),
    orderBy: { createdAt: 'desc' }
  });

  res.json({ payouts: payouts.map(parsePayoutMetadata) });
}

export async function supplierPayoutSummary(req, res) {
  const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
  if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

  const payouts = await prisma.supplierPayout.findMany({
    where: { supplierId: supplier.id }
  });

  res.json({ summary: summarizePayouts(payouts) });
}
