import { prisma } from '../db.js';

function normalizeVehicleInput(body) {
  const origin = String(body.origin || '').trim();
  const make = String(body.make || '').trim();
  const model = String(body.model || '').trim();
  const year = Number(body.year);
  const label = String(body.label || '').trim();

  return {
    origin,
    make,
    model,
    year,
    label: label || [year, make, model].filter(Boolean).join(' ')
  };
}

export async function mySavedVehicles(req, res) {
  const vehicles = await prisma.savedVehicle.findMany({
    where: {
      userId: req.user.id,
      market: req.user.market || 'IQ'
    },
    orderBy: [
      { isDefault: 'desc' },
      { updatedAt: 'desc' }
    ]
  });

  res.json({ vehicles });
}

export async function saveVehicle(req, res) {
  const data = normalizeVehicleInput(req.body);

  if (!data.origin || !data.make || !data.model || !Number.isFinite(data.year)) {
    return res.status(400).json({ message: 'Complete vehicle details are required' });
  }

  const market = req.user.market || 'IQ';

  const vehicle = await prisma.savedVehicle.upsert({
    where: {
      userId_market_origin_make_model_year: {
        userId: req.user.id,
        market,
        origin: data.origin,
        make: data.make,
        model: data.model,
        year: data.year
      }
    },
    update: {
      label: data.label,
      isDefault: true
    },
    create: {
      userId: req.user.id,
      market,
      origin: data.origin,
      make: data.make,
      model: data.model,
      year: data.year,
      label: data.label,
      isDefault: true
    }
  });

  await prisma.savedVehicle.updateMany({
    where: {
      userId: req.user.id,
      market,
      id: { not: vehicle.id }
    },
    data: { isDefault: false }
  });

  res.status(201).json({ vehicle });
}

export async function deleteSavedVehicle(req, res) {
  const existing = await prisma.savedVehicle.findUnique({
    where: { id: req.params.id }
  });

  if (!existing) return res.status(404).json({ message: 'Saved vehicle not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  await prisma.savedVehicle.delete({ where: { id: existing.id } });
  res.json({ ok: true });
}


export async function setDefaultSavedVehicle(req, res) {
  const existing = await prisma.savedVehicle.findUnique({
    where: { id: req.params.id }
  });

  if (!existing) return res.status(404).json({ message: 'Saved vehicle not found' });
  if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  const market = existing.market || req.user.market || 'IQ';

  await prisma.savedVehicle.updateMany({
    where: {
      userId: req.user.id,
      market
    },
    data: { isDefault: false }
  });

  const vehicle = await prisma.savedVehicle.update({
    where: { id: existing.id },
    data: { isDefault: true }
  });

  res.json({ vehicle });
}
