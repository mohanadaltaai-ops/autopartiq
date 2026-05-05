-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('CASH', 'ZAINCASH', 'MANUAL', 'OTHER');

-- CreateTable
CREATE TABLE "SupplierPayout" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PayoutMethod",
    "reference" TEXT,
    "notes" TEXT,
    "provider" TEXT,
    "providerTransactionId" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPayout_orderId_key" ON "SupplierPayout"("orderId");

-- AddForeignKey
ALTER TABLE "SupplierPayout"
ADD CONSTRAINT "SupplierPayout_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayout"
ADD CONSTRAINT "SupplierPayout_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
