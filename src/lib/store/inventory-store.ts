import {
  categories,
  initialAlerts,
  locations,
  movements as seedMovements,
  products,
  stockLevels as seedStockLevels,
} from "@/lib/data/seed";
import {
  calculateDaysUntilStockout,
  calculateRecommendedOrderQty,
  detectShrinkage,
  estimateDailyVelocity,
  getStockStatus,
  getUrgency,
} from "@/lib/engine/inventory-engine";
import type {
  Alert,
  DashboardMetrics,
  InventoryItem,
  RealtimeEvent,
  ReplenishmentPrediction,
  ShrinkageReport,
  StockLevel,
  StockMovement,
} from "@/lib/types";

type EventListener = (event: RealtimeEvent) => void;

class InventoryStore {
  private stockLevels: StockLevel[] = [...seedStockLevels];
  private movements: StockMovement[] = [...seedMovements];
  private alerts: Alert[] = [...initialAlerts];
  private listeners: Set<EventListener> = new Set();
  private simulationInterval: ReturnType<typeof setInterval> | null = null;

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: RealtimeEvent) {
    this.listeners.forEach((l) => l(event));
  }

  startSimulation() {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => this.simulateActivity(), 8000);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private simulateActivity() {
    const stock = this.stockLevels[Math.floor(Math.random() * this.stockLevels.length)];
    const product = products.find((p) => p.id === stock.productId);
    if (!product) return;

    const isInbound = Math.random() > 0.6;
    const qty = Math.floor(Math.random() * 15) + 1;

    if (isInbound) {
      stock.quantity += qty;
      this.addMovement({
        productId: stock.productId,
        locationId: stock.locationId,
        type: "inbound",
        quantity: qty,
        reference: `PO-${Math.floor(Math.random() * 90000) + 10000}`,
      });
    } else {
      const outbound = Math.min(qty, stock.quantity - stock.reserved);
      if (outbound <= 0) return;
      stock.quantity -= outbound;
      this.addMovement({
        productId: stock.productId,
        locationId: stock.locationId,
        type: "outbound",
        quantity: outbound,
        reference: `ORD-${Math.floor(Math.random() * 90000) + 10000}`,
      });

      const available = stock.quantity - stock.reserved;
      if (available <= product.reorderPoint) {
        this.maybeCreateLowStockAlert(stock, product, available);
      }
    }

    this.emit({
      type: "stock_update",
      payload: { stockLevel: stock, product },
      timestamp: new Date().toISOString(),
    });
    this.emit({
      type: "metrics",
      payload: this.getDashboardMetrics(),
      timestamp: new Date().toISOString(),
    });
  }

  private maybeCreateLowStockAlert(
    stock: StockLevel,
    product: (typeof products)[0],
    available: number
  ) {
    const exists = this.alerts.some(
      (a) =>
        !a.acknowledged &&
        a.productId === product.id &&
        a.locationId === stock.locationId &&
        a.type === "low_stock"
    );
    if (exists) return;

    const location = locations.find((l) => l.id === stock.locationId);
    const severity = available <= product.reorderPoint * 0.25 ? "critical" : "warning";
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      type: "low_stock",
      severity,
      title: `${severity === "critical" ? "Critical" : "Low"} Stock: ${product.name}`,
      message: `${location?.name ?? "Location"} has ${available} units (reorder point: ${product.reorderPoint})`,
      productId: product.id,
      locationId: stock.locationId,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    this.alerts.unshift(alert);
    this.emit({ type: "alert", payload: alert, timestamp: alert.timestamp });
  }

  getProducts() {
    return products;
  }

  getCategories() {
    return categories;
  }

  getLocations() {
    return locations;
  }

  getStockLevels() {
    return this.stockLevels;
  }

  getMovements(limit = 50) {
    return [...this.movements]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getAlerts(acknowledged?: boolean) {
    if (acknowledged === undefined) return this.alerts;
    return this.alerts.filter((a) => a.acknowledged === acknowledged);
  }

  acknowledgeAlert(id: string) {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) alert.acknowledged = true;
    return alert;
  }

  getInventoryItems(filters?: {
    search?: string;
    categoryId?: string;
    locationId?: string;
    status?: string;
  }): InventoryItem[] {
    let items = products.map((product) => {
      const category = categories.find((c) => c.id === product.categoryId);
      const productStocks = this.stockLevels.filter((s) => s.productId === product.id);

      const locationData = productStocks.map((stock) => {
        const location = locations.find((l) => l.id === stock.locationId)!;
        const available = stock.quantity - stock.reserved;
        return {
          locationId: stock.locationId,
          locationName: location.name,
          quantity: stock.quantity,
          reserved: stock.reserved,
          available,
          status: getStockStatus(stock.quantity, product.reorderPoint, stock.reserved),
        };
      });

      const totalQuantity = locationData.reduce((s, l) => s + l.quantity, 0);
      const totalAvailable = locationData.reduce((s, l) => s + l.available, 0);
      const worstStatus = locationData.reduce(
        (worst, l) => {
          const priority: Record<string, number> = {
            out_of_stock: 0,
            critical: 1,
            low_stock: 2,
            in_stock: 3,
            overstock: 4,
          };
          return priority[l.status] < priority[worst] ? l.status : worst;
        },
        "in_stock" as InventoryItem["status"]
      );

      return {
        ...product,
        categoryName: category?.name ?? "Unknown",
        locations: locationData,
        totalQuantity,
        totalAvailable,
        status: worstStatus,
      };
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.supplier.toLowerCase().includes(q)
      );
    }
    if (filters?.categoryId) {
      items = items.filter((i) => i.categoryId === filters.categoryId);
    }
    if (filters?.locationId) {
      items = items.filter((i) => i.locations.some((l) => l.locationId === filters.locationId));
    }
    if (filters?.status) {
      items = items.filter((i) => i.status === filters.status);
    }

    return items;
  }

  getReplenishmentPredictions(): ReplenishmentPrediction[] {
    const predictions: ReplenishmentPrediction[] = [];

    for (const stock of this.stockLevels) {
      const product = products.find((p) => p.id === stock.productId);
      const location = locations.find((l) => l.id === stock.locationId);
      if (!product || !location) continue;

      const available = stock.quantity - stock.reserved;
      const dailyVelocity = estimateDailyVelocity(product.categoryId, location.type, available);
      const daysUntilStockout = calculateDaysUntilStockout(available, dailyVelocity);

      if (daysUntilStockout > product.leadTimeDays * 3) continue;

      const urgency = getUrgency(daysUntilStockout, product.leadTimeDays);
      const recommendedOrderQty = calculateRecommendedOrderQty(
        available,
        dailyVelocity,
        product.leadTimeDays,
        product.reorderQuantity
      );

      predictions.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        locationId: location.id,
        locationName: location.name,
        currentStock: available,
        dailyVelocity: Math.round(dailyVelocity * 10) / 10,
        daysUntilStockout,
        recommendedOrderQty,
        urgency,
        estimatedCost: recommendedOrderQty * product.unitCost,
      });
    }

    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return predictions.sort(
      (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || a.daysUntilStockout - b.daysUntilStockout
    );
  }

  getShrinkageReports(): ShrinkageReport[] {
    const reports: ShrinkageReport[] = [];

    for (const stock of this.stockLevels) {
      const product = products.find((p) => p.id === stock.productId);
      const location = locations.find((l) => l.id === stock.locationId);
      if (!product || !location) continue;

      const shrinkage = detectShrinkage(stock.quantity, stock.expectedQuantity, product.unitCost);
      if (!shrinkage || !shrinkage.isAnomaly) continue;

      reports.push({
        productId: product.id,
        productName: product.name,
        locationId: location.id,
        locationName: location.name,
        expectedQty: stock.expectedQuantity!,
        actualQty: stock.quantity,
        variance: shrinkage.variance,
        variancePercent: shrinkage.variancePercent,
        estimatedLoss: shrinkage.estimatedLoss,
      });
    }

    return reports.sort((a, b) => b.estimatedLoss - a.estimatedLoss);
  }

  getDashboardMetrics(): DashboardMetrics {
    const items = this.getInventoryItems();
    const totalUnits = items.reduce((s, i) => s + i.totalQuantity, 0);
    const totalValue = items.reduce((s, i) => s + i.totalQuantity * i.unitCost, 0);
    const lowStockCount = items.filter((i) => i.status === "low_stock").length;
    const criticalStockCount = items.filter(
      (i) => i.status === "critical" || i.status === "out_of_stock"
    ).length;
    const activeAlerts = this.alerts.filter((a) => !a.acknowledged).length;
    const shrinkageLoss = this.getShrinkageReports().reduce((s, r) => s + r.estimatedLoss, 0);

    return {
      totalSKUs: products.length,
      totalUnits,
      totalValue,
      lowStockCount,
      criticalStockCount,
      activeAlerts,
      shrinkageLoss,
      fillRate: 94.2,
      turnoverRate: 6.8,
    };
  }

  getLocationUtilization() {
    return locations.map((loc) => {
      const locStock = this.stockLevels.filter((s) => s.locationId === loc.id);
      const used = locStock.reduce((s, st) => s + st.quantity, 0);
      return {
        ...loc,
        used,
        utilization: Math.round((used / loc.capacity) * 1000) / 10,
        skuCount: new Set(locStock.map((s) => s.productId)).size,
      };
    });
  }

  getStockTrend() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, i) => ({
      day,
      inbound: Math.floor(200 + Math.sin(i) * 80 + Math.random() * 50),
      outbound: Math.floor(180 + Math.cos(i) * 60 + Math.random() * 40),
      shrinkage: Math.floor(5 + Math.random() * 15),
    }));
  }

  getCategoryDistribution() {
    return categories.map((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id);
      const units = catProducts.reduce((sum, p) => {
        const stocks = this.stockLevels.filter((s) => s.productId === p.id);
        return sum + stocks.reduce((s, st) => s + st.quantity, 0);
      }, 0);
      return { name: cat.name, units, value: units };
    });
  }

  addMovement(data: Omit<StockMovement, "id" | "timestamp">) {
    const movement: StockMovement = {
      ...data,
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.movements.unshift(movement);
    this.emit({ type: "movement", payload: movement, timestamp: movement.timestamp });
    return movement;
  }

  transferStock(
    productId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number
  ) {
    const fromStock = this.stockLevels.find(
      (s) => s.productId === productId && s.locationId === fromLocationId
    );
    if (!fromStock || fromStock.quantity - fromStock.reserved < quantity) {
      throw new Error("Insufficient stock for transfer");
    }

    fromStock.quantity -= quantity;

    let toStock = this.stockLevels.find(
      (s) => s.productId === productId && s.locationId === toLocationId
    );
    if (!toStock) {
      toStock = {
        id: `stk-${Date.now()}`,
        productId,
        locationId: toLocationId,
        quantity: 0,
        reserved: 0,
        lastCounted: new Date().toISOString(),
      };
      this.stockLevels.push(toStock);
    }
    toStock.quantity += quantity;

    this.addMovement({
      productId,
      locationId: fromLocationId,
      type: "transfer",
      quantity,
      reference: `TRF-${Math.floor(Math.random() * 9000) + 1000}`,
      notes: `To ${toLocationId}`,
    });

    return { fromStock, toStock };
  }

  adjustStock(productId: string, locationId: string, newQuantity: number, reason?: string) {
    const stock = this.stockLevels.find(
      (s) => s.productId === productId && s.locationId === locationId
    );
    if (!stock) throw new Error("Stock level not found");

    const diff = newQuantity - stock.quantity;
    stock.quantity = newQuantity;
    stock.lastCounted = new Date().toISOString();

    this.addMovement({
      productId,
      locationId,
      type: diff < 0 ? "shrinkage" : "adjustment",
      quantity: Math.abs(diff),
      notes: reason ?? "Manual adjustment",
    });

    return stock;
  }
}

export function getStore(): InventoryStore {
  const g = globalThis as typeof globalThis & { __inventoryStore?: InventoryStore };
  if (!g.__inventoryStore) {
    g.__inventoryStore = new InventoryStore();
    g.__inventoryStore.startSimulation();
  }
  return g.__inventoryStore;
}
