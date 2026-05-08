import { prisma } from '../db.js';

function normalizePhotoUrls(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => typeof item === 'string' && item.trim()).slice(0, 4);
}

function sanitizeRequestForSupplier(request) {
  const { customerPhone, location, customer, ...safeRequest } = request;
  return safeRequest;
}

export async function createRequest(req, res) {
  const data = req.body;
  if (!data.origin || !data.make || !data.model || !data.year || !data.partName) {
    return res.status(400).json({ message: 'Complete car details and part name' });
  }
  if (!data.customerPhone || !data.location) {
    return res.status(400).json({ message: 'Customer phone and detailed location' });
  }

  const request = await prisma.partRequest.create({
    data: {
      customerId: req.user.id,
      market: req.user.market || 'IQ',
      origin: data.origin,
      make: data.make,
      model: data.model,
      year: Number(data.year),
      partName: data.partName,
      description: data.description || null,
      partNumber: data.partNumber || null,
      vin: data.vin || null,
      location: data.location,
      customerPhone: data.customerPhone,
      photoUrlsJson: JSON.stringify(normalizePhotoUrls(data.photoUrls))
    }
  });

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
        market: request.market
      },
      include: { user: true }
    });

    const matchingSuppliers = suppliers.filter((supplier) => {
      try {
        const supportedMakes = JSON.parse(supplier.supportedMakesJson || '[]');
        return supportedMakes.includes(request.origin);
      } catch {
        return false;
      }
    });

    if (matchingSuppliers.length) {
      await prisma.notification.createMany({
        data: matchingSuppliers
          .filter(supplier => supplier.userId)
          .map(supplier => ({
            userId: supplier.userId,
            message: `New lead available: ${request.partName}`,
            metadataJson: JSON.stringify({
              type: 'NEW_LEAD',
              requestId: request.id,
              partName: request.partName,
              make: request.make,
              model: request.model,
              year: request.year,
              tab: 'home'
            })
          }))
      });
    }
  } catch (error) {
    console.error('Failed to notify suppliers for new lead', error);
  }

  res.status(201).json({ request });
}

export async function myRequests(req, res) {
  const requests = await prisma.partRequest.findMany({
    where: { customerId: req.user.id },
    include: { offers: { include: { supplier: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ requests });
}

export async function cancelRequest(req, res) {
  const existing = await prisma.partRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Request not found' });
  if (existing.customerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (existing.status !== 'WAITING') return res.status(400).json({ message: 'Only waiting requests can be cancelled' });

  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
  if (!reason) return res.status(400).json({ message: 'Reason for cancellation' });

  const request = await prisma.partRequest.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', cancellationReason: reason }
  });
  res.json({ request });
}

export async function supplierLeads(req, res) {
  const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
  if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });
  if (!supplier.isActive) return res.status(403).json({ message: 'Supplier account is disabled' });

  const supportedMakes = JSON.parse(supplier.supportedMakesJson || '[]');
  const requests = await prisma.partRequest.findMany({
    where: {
      origin: { in: supportedMakes },
      status: 'WAITING',
      market: supplier.market || req.user.market || 'IQ',
      offers: { none: { supplierId: supplier.id } }
    },
    include: { offers: true },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ requests: requests.map(sanitizeRequestForSupplier) });
}
