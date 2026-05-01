import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.order.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.partRequest.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { name: 'Demo Customer', phone: '07799999999', role: 'CUSTOMER' },
      { name: 'Admin', phone: '07711111111', role: 'ADMIN' },
      { name: 'Super Admin', phone: '07700000000', role: 'SUPER_ADMIN' }
    ]
  });

  const sUser = await prisma.user.create({ data: { name: 'Al-Sadiq Parts', phone: '07701234567', role: 'SUPPLIER' } });
  await prisma.supplier.create({
    data: {
      userId: sUser.id,
      name: 'Al-Sadiq Parts',
      phone: '07701234567',
      location: 'Baghdad',
      supportedMakesJson: JSON.stringify(['Japanese', 'Korean', 'Chinese'])
    }
  });

  const gUser = await prisma.user.create({ data: { name: 'German Expert', phone: '07709876543', role: 'SUPPLIER' } });
  await prisma.supplier.create({
    data: {
      userId: gUser.id,
      name: 'German Expert',
      phone: '07709876543',
      location: 'Erbil',
      supportedMakesJson: JSON.stringify(['German'])
    }
  });

  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());
