export function getMarginRate(supplierPrice) {
  if (supplierPrice < 100000) return 0.10;
  if (supplierPrice <= 200000) return 0.13;
  return 0.14;
}

export function roundToNearest250(amount) {
  return Math.round(amount / 250) * 250;
}

export function calculateCustomerPrice(supplierPrice) {
  return roundToNearest250(supplierPrice * (1 + getMarginRate(supplierPrice)));
}

export function calculatePlatformRevenue(supplierPrice) {
  return calculateCustomerPrice(supplierPrice) - supplierPrice;
}

export function calculatePricing(supplierPrice) {
  const customerPrice = calculateCustomerPrice(supplierPrice);
  return {
    supplierPrice,
    customerPrice,
    platformRevenue: customerPrice - supplierPrice,
    marginRate: getMarginRate(supplierPrice)
  };
}
