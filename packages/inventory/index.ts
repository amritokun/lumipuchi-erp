export interface StockLevels {
  productId: string;
  warehouseQty: number; // local physical stock
  inTransitQty: number;  // POs in transit from China
  virtualQty: number;    // warehouseQty + inTransitQty - reserved/allocated
  allocatedQty: number;  // reserved for orders in process
  reorderPoint: number;
}

export function isReorderRequired(warehouseQty: number, reorderPoint: number): boolean {
  return warehouseQty <= reorderPoint;
}

export function calculateVirtualQty(warehouseQty: number, inTransitQty: number, allocatedQty: number): number {
  return warehouseQty + inTransitQty - allocatedQty;
}
