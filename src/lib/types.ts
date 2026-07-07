export type StockStatus = "in_stock" | "low_stock" | "critical" | "out_of_stock" | "overstock";

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertType =
  | "low_stock"
  | "shrinkage"
  | "replenishment"
  | "overstock"
  | "transfer"
  | "anomaly";

export type MovementType = "inbound" | "outbound" | "transfer" | "adjustment" | "shrinkage";

export interface Location {
  id: string;
  name: string;
  code: string;
  type: "warehouse" | "store" | "distribution";
  address: string;
  capacity: number;
  manager: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  unitCost: number;
  unitPrice: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  supplier: string;
}

export interface StockLevel {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  reserved: number;
  lastCounted: string;
  expectedQuantity?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  locationId: string;
  type: MovementType;
  quantity: number;
  timestamp: string;
  reference?: string;
  notes?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  productId?: string;
  locationId?: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ReplenishmentPrediction {
  productId: string;
  productName: string;
  sku: string;
  locationId: string;
  locationName: string;
  currentStock: number;
  dailyVelocity: number;
  daysUntilStockout: number;
  recommendedOrderQty: number;
  urgency: "low" | "medium" | "high" | "critical";
  estimatedCost: number;
}

export interface ShrinkageReport {
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  expectedQty: number;
  actualQty: number;
  variance: number;
  variancePercent: number;
  estimatedLoss: number;
}

export interface DashboardMetrics {
  totalSKUs: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
  criticalStockCount: number;
  activeAlerts: number;
  shrinkageLoss: number;
  fillRate: number;
  turnoverRate: number;
}

export interface InventoryItem extends Product {
  categoryName: string;
  locations: Array<{
    locationId: string;
    locationName: string;
    quantity: number;
    reserved: number;
    available: number;
    status: StockStatus;
  }>;
  totalQuantity: number;
  totalAvailable: number;
  status: StockStatus;
}

export type RealtimeEvent = {
  type: "init" | "stock_update" | "alert" | "movement" | "metrics";
  payload: unknown;
  timestamp: string;
};
