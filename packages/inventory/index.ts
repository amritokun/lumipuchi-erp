export interface StockLevels {
  productId: string;
  warehouseQty: number;
  inTransitQty: number;
  virtualQty: number;
  allocatedQty: number;
  reorderPoint: number;
}

export function isReorderRequired(warehouseQty: number, reorderPoint: number): boolean {
  return warehouseQty <= reorderPoint;
}

export function calculateVirtualQty(warehouseQty: number, inTransitQty: number, allocatedQty: number): number {
  return warehouseQty + inTransitQty - allocatedQty;
}
