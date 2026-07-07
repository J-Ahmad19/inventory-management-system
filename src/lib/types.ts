export type LocationType = "WAREHOUSE" | "RETAIL" | "DARK_STORE";
export type TransactionType = "INBOUND" | "OUTBOUND" | "TRANSFER" | "ADJUST";
export type AlertType =
  | "LOW_STOCK"
  | "LOW_STOCK_PREDICTION"
  | "OVERSTOCK"
  | "SHRINKAGE";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  lead_time_days: number;
  base_price: number;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  location_id: string;
  qty_on_hand: number;
  qty_allocated: number;
  reorder_point: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  location?: Location;
}

export interface TransactionLedger {
  id: string;
  type: TransactionType;
  product_id: string;
  from_location: string | null;
  to_location: string | null;
  quantity: number;
  reason: string | null;
  initiated_by: string | null;
  timestamp: string;
  product?: Product;
  fromLocation?: Location;
  toLocation?: Location;
}

export interface Alert {
  id: string;
  type: AlertType;
  product_id: string;
  location_id: string | null;
  message: string;
  days_until_stockout: number | null;
  recommended_order_qty: number | null;
  confidence_score: number | null;
  acknowledged: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  location?: Location;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalLocations: number;
  lowStockItems: number;
  pendingAlerts: number;
  totalInventoryValue: number;
  stockoutRiskItems: number;
}

export interface InventoryTransfer {
  product_id: string;
  from_location: string;
  to_location: string;
  quantity: number;
  reason?: string;
}

export interface StockAdjustment {
  product_id: string;
  location_id: string;
  quantity_change: number;
  reason: string;
  initiated_by: string;
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
