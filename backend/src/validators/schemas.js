import { z } from 'zod';

const emptyToNull = value => value === '' ? null : value;
const phone = z.string().min(7).max(20);
const optionalText = z.preprocess(emptyToNull, z.string().max(500).optional().nullable());
const optionalUrl = z.preprocess(emptyToNull, z.string().url().optional().nullable());
const photoUrls = z.array(z.string().url()).max(5).optional().default([]);

export const loginSchema = z.object({
  phone,
  otp: z.string().min(4).max(8)
});

export const requestCreateSchema = z.object({
  origin: z.string().min(2).max(50),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(80),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  partName: z.string().min(2).max(120),
  description: optionalText,
  partNumber: optionalText,
  vin: z.preprocess(emptyToNull, z.string().max(40).optional().nullable()),
  location: optionalText,
  customerPhone: z.preprocess(emptyToNull, z.string().max(20).optional().nullable()),
  photoUrls
});

export const requestCancelSchema = z.object({
  reason: z.string().max(500).optional().default('')
});

export const offerCreateSchema = z.object({
  supplierPrice: z.coerce.number().int().positive(),
  condition: z.enum(['NEW', 'USED']),
  notes: optionalText,
  photoUrl: optionalUrl,
  photoUrls
});

export const orderStatusSchema = z.object({
  status: z.enum(['WAITING_PICKUP', 'DELIVERING', 'COMPLETED', 'CANCELLED'])
});

export const paymentUpdateSchema = z.object({
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'CARD', 'WALLET', 'BANK_TRANSFER']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional()
});

export const deliveryAssignmentSchema = z.object({
  driverName: z.preprocess(emptyToNull, z.string().max(120).optional().nullable()),
  driverPhone: z.preprocess(emptyToNull, z.string().max(30).optional().nullable()),
  pickupEta: z.preprocess(emptyToNull, z.string().max(120).optional().nullable()),
  deliveryEta: z.preprocess(emptyToNull, z.string().max(120).optional().nullable()),
  proofOfDeliveryUrl: optionalUrl,
  deliveryNotes: optionalText
});

export const supplierSchema = z.object({
  name: z.string().min(2).max(120),
  phone,
  location: z.string().min(2).max(120),
  supportedMakes: z.array(z.string().min(2).max(50)).max(12).default([]),
  isActive: z.boolean().optional()
});

export const aiIdentifySchema = z.object({
  problem: z.string().min(3).max(1000)
});
