export interface ChannelFees {
  referralFeePercent: number;
  fixedClosingFee: number;
  weightHandlingFee: number;
  otherFees: number;
}

export interface PricingResult {
  sellingPrice: number;
  landedCost: number;
  referralFee: number;
  closingFee: number;
  weightHandlingFee: number;
  gstAmount: number;
  totalFees: number;
  netPayout: number;
  netMarginAmount: number;
  netMarginPercent: number;
}

export function calculateChannelPayout(
  sellingPrice: number,
  landedCost: number,
  gstPercent: number,
  fees: ChannelFees
): PricingResult {
  const referralFee = (sellingPrice * fees.referralFeePercent) / 100;
  const closingFee = fees.fixedClosingFee;
  const weightHandlingFee = fees.weightHandlingFee;
  const otherFees = fees.otherFees;

  const totalFees = referralFee + closingFee + weightHandlingFee + otherFees;
  const gstAmount = (sellingPrice * gstPercent) / 100;

  // Net payout received from platform (exclusive of return rates logic for base calculation)
  const netPayout = sellingPrice - totalFees - gstAmount;
  const netMarginAmount = netPayout - landedCost;
  const netMarginPercent = sellingPrice > 0 ? (netMarginAmount / sellingPrice) * 100 : 0;

  return {
    sellingPrice,
    landedCost,
    referralFee,
    closingFee,
    weightHandlingFee,
    gstAmount,
    totalFees,
    netPayout,
    netMarginAmount,
    netMarginPercent,
  };
}
