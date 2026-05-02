import { prisma } from '../db.js';
import { calculatePricing } from '../utils/pricing.js';
import { generateOrderNumber } from '../utils/orderNumber.js';

const ALLOWED_CONDITIONS = ['NEW', 'USED'];

function normalizePhotoUrls(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => typeof item === 'string' && item.trim()).slice(0, 5);
}

function sanitizeOfferForSupplier(offer) {
  if (!offer.request) return offer;
  const { customerPhone, location, customer, ...safeRequest } = offer.request;
  return { ...offer, request: safeRequest };
}

export async function createOffer(req, res) {
  const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
  if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

  const request = await prisma.partRequest.findUnique({ where: { id: req.params.requestId }, include: { offers: true } });
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'WAITING') return res.status(400).json({ message: 'Only waiting requests can receive offers' });

  const supportedMakes = JSON.parse(supplier.supportedMakesJson || '[]');
  if (!supportedMakes.includes(request.origin)) return res.status(403).json({ message: 'This lead is not assigned to your supported car origins' });

  const supplierPrice = Number(req.body.supplierPrice);
  if (!Number.isFinite(supplierPrice) || supplierPrice <= 0) return res.status(400).json({ message: 'Valid supplier price is required' });
  if (!ALLOWED_CONDITIONS.includes(req.body.condition)) return res.status(400).json({ message: 'Invalid part condition' });

  const photoUrls = normalizePhotoUrls(req.body.photoUrls);
  const pricing = calculatePricing(supplierPrice);
  const existingOffer = request.offers.find(offer => offer.supplierId === supplier.id && offer.status === 'ACTIVE');

  if (existingOffer) {
    const updatedOffer = await prisma.offer.update({
      where: { id: existingOffer.id },
      data: {
        supplierPrice,
        customerPrice: pricing.customerPrice,
        platformRevenue: pricing.platformRevenue,
        condition: req.body.condition,
        notes: req.body.notes || null,
        photoUrl: photoUrls[0] || req.body.photoUrl || existingOffer.photoUrl || null,
        photoUrlsJson: JSON.stringify(photoUrls)
      },
      include: { request: true, supplier: true }
    });

    return res.json({ offer: sanitizeOfferForSupplier(updatedOffer), updated: true });
  }

  const offer = await prisma.offer.create({
    data: {
      requestId: request.id,
      supplierId: supplier.id,
      supplierPrice,
      customerPrice: pricing.customerPrice,
      platformRevenue: pricing.platformRevenue,
      condition: req.body.condition,
      notes: req.body.notes || null,
      photoUrl: photoUrls[0] || req.body.photoUrl || null,
      photoUrlsJson: JSON.stringify(photoUrls)
    },
    include: { request: true, supplier: true }
  });

  await prisma.notification.create({
    data: { userId: offer.request.customerId, message: `You have a new ${offer.condition.toLowerCase()} offer for ${offer.request.partName}` }
  });

  res.status(201).json({ offer: sanitizeOfferForSupplier(offer), updated: false });
}

export async function supplierOffers(req, res) {
  const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
  if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

  const offers = await prisma.offer.findMany({
    where: { supplierId: supplier.id },
    include: { request: true, order: true },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ offers: offers.map(sanitizeOfferForSupplier) });
}

export async function cancelOffer(req, res) {
  const supplier = await prisma.supplier.findUnique({ where: { userId: req.user.id } });
  if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

  const offer = await prisma.offer.findUnique({ where: { id: req.params.offerId }, include: { order: true } });
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  if (offer.supplierId !== supplier.id) return res.status(403).json({ message: 'Forbidden' });
  if (offer.status !== 'ACTIVE') return res.status(400).json({ message: 'Only active offers can be cancelled' });
  if (offer.order) return res.status(400).json({ message: 'Accepted offers cannot be cancelled' });

  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
  if (!reason) return res.status(400).json({ message: 'Cancellation reason is required' });

  const cancelled = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'CANCELLED', cancellationReason: reason } });
  res.json({ offer: cancelled });
}

export async function acceptOffer(req, res) {
  const offer = await prisma.offer.findUnique({ where: { id: req.params.offerId }, include: { request: true } });
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  if (offer.request.customerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (offer.status !== 'ACTIVE') return res.status(400).json({ message: 'Only active offers can be accepted' });
  if (offer.request.status !== 'WAITING') return res.status(400).json({ message: 'This request is no longer available' });

  const order = await prisma.$transaction(async (tx) => {
    await tx.offer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED' } });
    await tx.partRequest.update({ where: { id: offer.requestId }, data: { status: 'PROCESSING' } });
    await tx.offer.updateMany({ where: { requestId: offer.requestId, id: { not: offer.id } }, data: { status: 'REJECTED' } });
    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        offerId: offer.id,
        supplierId: offer.supplierId,
        customerId: offer.request.customerId,
        supplierPrice: offer.supplierPrice,
        customerPrice: offer.customerPrice,
        platformRevenue: offer.platformRevenue
      },
      include: { offer: { include: { request: true, supplier: true } } }
    });
  });

  res.status(201).json({ order });
}
