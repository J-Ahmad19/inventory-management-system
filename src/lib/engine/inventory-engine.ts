import type { StockStatus } from "@/lib/types";

export function getStockStatus(
  quantity: number,
  reorderPoint: number,
  reserved: number = 0
): StockStatus {
  const available = quantity - reserved;
  if (available <= 0) return "out_of_stock";
  if (available <= reorderPoint * 0.25) return "critical";
  if (available <= reorderPoint) return "low_stock";
  if (available > reorderPoint * 5) return "overstock";
  return "in_stock";
}

export function getStatusLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    in_stock: "In Stock",
    low_stock: "Low Stock",
    critical: "Critical",
    out_of_stock: "Out of Stock",
    overstock: "Overstock",
  };
  return labels[status];
}

export function getStatusColor(status: StockStatus): string {
  const colors: Record<StockStatus, string> = {
    in_stock: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    low_stock: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    critical: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    out_of_stock: "text-red-400 bg-red-400/10 border-red-400/20",
    overstock: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  };
  return colors[status];
}

// Velocity estimates based on product category and location type
const BASE_VELOCITY: Record<string, number> = {
  "cat-1": 8,
  "cat-2": 15,
  "cat-3": 5,
  "cat-4": 25,
  "cat-5": 3,
};

const LOCATION_MULTIPLIER: Record<string, number> = {
  warehouse: 0.3,
  distribution: 0.6,
  store: 1.5,
};

export function estimateDailyVelocity(
  categoryId: string,
  locationType: string,
  currentStock: number
): number {
  const base = BASE_VELOCITY[categoryId] ?? 5;
  const multiplier = LOCATION_MULTIPLIER[locationType] ?? 1;
  const stockFactor = currentStock < 50 ? 1.2 : currentStock > 500 ? 0.8 : 1;
  return Math.max(0.5, base * multiplier * stockFactor * (0.8 + Math.random() * 0.4));
}

export function calculateDaysUntilStockout(stock: number, dailyVelocity: number): number {
  if (dailyVelocity <= 0) return 999;
  return Math.round((stock / dailyVelocity) * 10) / 10;
}

export function getUrgency(
  daysUntilStockout: number,
  leadTimeDays: number
): "low" | "medium" | "high" | "critical" {
  if (daysUntilStockout <= leadTimeDays * 0.5) return "critical";
  if (daysUntilStockout <= leadTimeDays) return "high";
  if (daysUntilStockout <= leadTimeDays * 2) return "medium";
  return "low";
}

export function calculateRecommendedOrderQty(
  currentStock: number,
  dailyVelocity: number,
  leadTimeDays: number,
  reorderQuantity: number,
  safetyStockDays: number = 7
): number {
  const demandDuringLeadTime = dailyVelocity * leadTimeDays;
  const safetyStock = dailyVelocity * safetyStockDays;
  const targetStock = demandDuringLeadTime + safetyStock;
  const deficit = Math.max(0, targetStock - currentStock);
  return Math.max(reorderQuantity, Math.ceil(deficit));
}

export function detectShrinkage(
  actualQty: number,
  expectedQty: number | undefined,
  unitCost: number
): { variance: number; variancePercent: number; estimatedLoss: number; isAnomaly: boolean } | null {
  if (expectedQty === undefined) return null;
  const variance = expectedQty - actualQty;
  if (variance <= 0) return null;
  const variancePercent = (variance / expectedQty) * 100;
  return {
    variance,
    variancePercent,
    estimatedLoss: variance * unitCost,
    isAnomaly: variancePercent > 10,
  };
}
