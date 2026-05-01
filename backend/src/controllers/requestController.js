import { prisma } from '../db.js';

export async function createRequest(req, res) {
  const data = req.body;
  const request = await prisma.partRequest.create({
    data: {
      customerId: req.user.id,
      origin: data.origin,
      make: data.make,
      model: data.model,
      year: Number(data.year),
      partName: data.partName,
      description: data.description || null,
      partNumber: data.partNumber || null,
      vin: data.vin || null,
      location: data.location || null,
      customerPhone: data.customerPhone || null
    }
  });
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
  const request = await prisma.partRequest.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
  res.json({ request });
}

export async function supplierLeads(req, res) {
  const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
  if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });
  const supportedMakes = JSON.parse(supplier.supportedMakesJson || '[]');
  const requests = await prisma.partRequest.findMany({
    where: { origin: { in: supportedMakes }, status: 'WAITING' },
    include: { offers: true, customer: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ requests });
}
