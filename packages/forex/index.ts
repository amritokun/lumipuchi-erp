export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

export function convertCurrency(amount: number, rate: number): number {
  return amount * rate;
}

export function calculateLandedCost(
  exFactoryCostForeign: number,
  exchangeRate: number,
  customsDutyPercent: number,
  shippingCostInrPerUnit: number,
  otherChargesInrPerUnit: number = 0
): number {
  const costInr = exFactoryCostForeign * exchangeRate;
  const customsDutyVal = costInr * (customsDutyPercent / 100);
  return costInr + customsDutyVal + shippingCostInrPerUnit + otherChargesInrPerUnit;
}
