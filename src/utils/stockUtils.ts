import type { ProductColor, StockStatus } from '../types/database.types';

/**
 * Calculate stock status based on color variants
 */
export const getStockStatus = (colorVariants: ProductColor[]): {
  status: StockStatus;
  color: string;
} => {
  const totalStock = colorVariants.reduce(
    (sum, color) => sum + color.available_quantity,
    0
  );
  const lowStockColors = colorVariants.filter(
    color => color.available_quantity <= color.reorder_level && color.available_quantity > 0
  );

  // Check for negative stock first (backorders/overlapping orders)
  if (totalStock < 0) {
    return { status: 'NEGATIVE_STOCK', color: 'purple' };
  }
  if (totalStock === 0) {
    return { status: 'OUT_OF_STOCK', color: 'red' };
  }
  if (lowStockColors.length > 0) {
    return { status: 'LOW_STOCK', color: 'orange' };
  }
  return { status: 'IN_STOCK', color: 'green' };
};

/**
 * Calculate total stock across all color variants
 */
export const getTotalStock = (colorVariants: ProductColor[]): number => {
  return colorVariants.reduce(
    (sum, color) => sum + color.available_quantity,
    0
  );
};

/**
 * Calculate total reserved stock
 */
export const getTotalReserved = (colorVariants: ProductColor[]): number => {
  return colorVariants.reduce(
    (sum, color) => sum + color.reserved_quantity,
    0
  );
};

/**
 * Check if a specific color has enough stock for an order
 */
export const hasEnoughStock = (
  colorVariant: ProductColor,
  requestedQuantity: number
): boolean => {
  return colorVariant.available_quantity >= requestedQuantity;
};

/**
 * Get low stock color variants
 */
export const getLowStockColors = (
  colorVariants: ProductColor[]
): ProductColor[] => {
  return colorVariants.filter(
    color =>
      color.available_quantity > 0 &&
      color.available_quantity <= color.reorder_level
  );
};

/**
 * Get out of stock color variants (including negative stock)
 */
export const getOutOfStockColors = (
  colorVariants: ProductColor[]
): ProductColor[] => {
  return colorVariants.filter(color => color.available_quantity <= 0);
};

/**
 * Get negative stock color variants (backorders)
 */
export const getNegativeStockColors = (
  colorVariants: ProductColor[]
): ProductColor[] => {
  return colorVariants.filter(color => color.available_quantity < 0);
};
