# StockFlow CRUD Operations

Complete documentation of all Create, Read, Update, Delete operations available in the StockFlow inventory management system.

## API Endpoints Overview

### Products Management

#### GET `/api/products`
Retrieve all products with pagination and filtering.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "sku": "PROD-001",
      "name": "Product Name",
      "category": "Electronics",
      "lead_time_days": 7,
      "base_price": 29999,
      "created_at": "2026-07-07T15:18:15.486Z",
      "updated_at": "2026-07-07T15:18:15.486Z"
    }
  ]
}
```

#### POST `/api/products`
Create a new product.

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Laptop Pro",
  "category": "Electronics",
  "lead_time_days": 7,
  "base_price": 299999
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Laptop Pro",
    ...
  }
}
```

#### PATCH `/api/products/{id}`
Update an existing product.

**Request Body:**
```json
{
  "name": "Laptop Pro Max",
  "category": "Electronics",
  "lead_time_days": 10,
  "base_price": 349999
}
```

**Response:** `200 OK`

#### DELETE `/api/products/{id}`
Delete a product.

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

### Locations Management

#### GET `/api/locations`
Retrieve all warehouse locations.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Main Warehouse",
      "type": "WAREHOUSE",
      "capacity": 10000,
      "created_at": "2026-07-07T15:18:15.486Z",
      "updated_at": "2026-07-07T15:18:15.486Z"
    }
  ]
}
```

#### POST `/api/locations`
Create a new location.

**Request Body:**
```json
{
  "name": "Downtown Retail Store",
  "type": "RETAIL",
  "capacity": 2000
}
```

**Location Types:**
- `WAREHOUSE` - Large warehouse facility
- `RETAIL` - Retail storefront
- `DARK_STORE` - Dark store / fulfillment center

#### PATCH `/api/locations/{id}`
Update location details.

**Request Body:**
```json
{
  "name": "Updated Warehouse",
  "type": "WAREHOUSE",
  "capacity": 15000
}
```

#### DELETE `/api/locations/{id}`
Delete a location.

---

### Inventory Management

#### GET `/api/inventory`
Retrieve inventory across all locations and products.

**Query Parameters:**
- `productId` - Filter by product
- `locationId` - Filter by location

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "location_id": "uuid",
      "qty_on_hand": 185,
      "qty_allocated": 37,
      "reorder_point": 50,
      "created_at": "2026-07-07T15:18:15.486Z",
      "updated_at": "2026-07-07T15:18:15.486Z",
      "product": { ... },
      "location": { ... }
    }
  ]
}
```

#### POST `/api/inventory/adjust`
Adjust stock quantity at a location (add or remove stock).

**Request Body:**
```json
{
  "product_id": "uuid",
  "location_id": "uuid",
  "quantity_change": 50,
  "reason": "Stock arrival from supplier",
  "initiated_by": "Admin"
}
```

**Response:**
```json
{
  "success": true,
  "qty_on_hand": 235
}
```

**Notes:**
- Positive numbers increase stock
- Negative numbers decrease stock
- Creates transaction ledger entry automatically
- Quantity cannot go below 0 (clamped to 0)

#### POST `/api/inventory/transfer`
Transfer stock between locations.

**Request Body:**
```json
{
  "product_id": "uuid",
  "from_location": "uuid",
  "to_location": "uuid",
  "quantity": 25,
  "reason": "Rebalancing inventory"
}
```

**Response:**
```json
{
  "success": true,
  "from_qty": 160,
  "to_qty": 210
}
```

**Validation:**
- Checks sufficient stock at source location
- Validates both locations exist
- Validates product exists
- ACID-compliant transaction

---

### Alerts Management

#### GET `/api/alerts`
Retrieve alerts and notifications.

**Query Parameters:**
- `unacknowledged=true` - Show only unacknowledged alerts

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "LOW_STOCK",
      "product_id": "uuid",
      "location_id": "uuid",
      "message": "Stock below reorder point",
      "days_until_stockout": 3,
      "recommended_order_qty": 100,
      "confidence_score": 0.95,
      "acknowledged": false,
      "created_at": "2026-07-07T15:18:15.486Z",
      "updated_at": "2026-07-07T15:18:15.486Z"
    }
  ]
}
```

#### PATCH `/api/alerts`
Acknowledge/resolve an alert.

**Request Body:**
```json
{
  "alert_id": "uuid",
  "acknowledged": true
}
```

**Response:**
```json
{
  "success": true
}
```

**Alert Types:**
- `LOW_STOCK` - Current stock below reorder point
- `LOW_STOCK_PREDICTION` - AI prediction of future stockout
- `OVERSTOCK` - Excess inventory detected
- `SHRINKAGE` - Inventory discrepancy detected

---

### Metrics & Analytics

#### GET `/api/metrics`
Get dashboard KPI metrics.

**Response:**
```json
{
  "totalProducts": 5,
  "totalLocations": 3,
  "lowStockItems": 2,
  "pendingAlerts": 3,
  "totalInventoryValue": 1063619.44,
  "stockoutRiskItems": 1
}
```

#### GET `/api/analytics`
Get detailed analytics including trends, categories, and predictions.

**Response:**
```json
{
  "metrics": { ... },
  "trends": [
    {
      "day": "Jul 7",
      "inbound": 150,
      "outbound": 85,
      "shrinkage": 0
    }
  ],
  "categories": [
    {
      "name": "Electronics",
      "units": 450,
      "value": 125000
    }
  ],
  "locations": [
    {
      "name": "Main Warehouse",
      "utilization": 65,
      "used": 6500,
      "capacity": 10000
    }
  ],
  "recentMovements": [ ... ],
  "predictions": [ ... ],
  "shrinkage": [ ... ]
}
```

---

## UI Pages

### Management Pages

- **Dashboard** (`/`) - Real-time KPIs, stock trends, alerts
- **Inventory** (`/inventory`) - Browse all inventory with search/filter
  - Click settings icon to adjust stock quantity
- **Products** (`/products`) - Create, edit, delete products
- **Locations Management** (`/locations/management`) - Create, edit, delete locations
- **Analytics** (`/analytics`) - Advanced reporting and insights
- **Alerts** (`/alerts`) - View and acknowledge alerts

### Management Features

#### Product Management (`/products`)
- ✅ Add new product with SKU, name, category, pricing
- ✅ Edit product details and prices
- ✅ Delete products (cascades to inventory)
- ✅ Table view with sort/filter

#### Location Management (`/locations/management`)
- ✅ Add new warehouse/retail location
- ✅ Select location type (WAREHOUSE, RETAIL, DARK_STORE)
- ✅ Set capacity limits
- ✅ Edit and delete locations

#### Stock Adjustment (`/inventory`)
- ✅ Expand product rows to see location details
- ✅ Click settings icon on any location row
- ✅ Add or remove stock with reason tracking
- ✅ Real-time quantity updates

---

## Example CRUD Workflows

### Create a New Product and Add Stock

1. **Create Product**
   ```bash
   POST /api/products
   {
     "sku": "PHONE-001",
     "name": "Smart Phone",
     "category": "Electronics",
     "lead_time_days": 5,
     "base_price": 79999
   }
   ```

2. **Adjust Stock** (after product receives first shipment)
   ```bash
   POST /api/inventory/adjust
   {
     "product_id": "{product_id}",
     "location_id": "{location_id}",
     "quantity_change": 100,
     "reason": "Initial stock receipt",
     "initiated_by": "Warehouse Manager"
   }
   ```

### Rebalance Inventory Between Locations

1. **Check Current Inventory**
   ```bash
   GET /api/inventory?productId={id}
   ```

2. **Transfer Stock**
   ```bash
   POST /api/inventory/transfer
   {
     "product_id": "{product_id}",
     "from_location": "{warehouse_id}",
     "to_location": "{retail_id}",
     "quantity": 50,
     "reason": "Restocking retail location"
   }
   ```

### Respond to Low Stock Alert

1. **View Alerts**
   ```bash
   GET /api/alerts?unacknowledged=true
   ```

2. **Add Stock**
   ```bash
   POST /api/inventory/adjust
   {
     "product_id": "{alert.product_id}",
     "location_id": "{alert.location_id}",
     "quantity_change": "{recommended_qty}",
     "reason": "Alert response",
     "initiated_by": "Admin"
   }
   ```

3. **Acknowledge Alert**
   ```bash
   PATCH /api/alerts
   {
     "alert_id": "{alert_id}",
     "acknowledged": true
   }
   ```

---

## Transaction Logging

All operations automatically create transaction ledger entries for audit trail:

```json
{
  "id": "uuid",
  "type": "ADJUST|INBOUND|OUTBOUND|TRANSFER",
  "product_id": "uuid",
  "from_location": "uuid|null",
  "to_location": "uuid|null",
  "quantity": 50,
  "reason": "Stock adjustment reason",
  "initiated_by": "Admin",
  "timestamp": "2026-07-07T15:18:15.486Z"
}
```

Transaction types:
- `INBOUND` - Stock received (adjustments with positive quantity)
- `OUTBOUND` - Stock shipped (adjustments with negative quantity)
- `TRANSFER` - Inter-location movement
- `ADJUST` - Manual adjustment or correction

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful operation
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input or missing required fields
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "error": "Description of what went wrong"
}
```

---

## Best Practices

1. **Always validate user input** on the client side
2. **Use meaningful reasons** for all adjustments and transfers
3. **Check current inventory** before transfers to avoid failures
4. **Monitor low stock alerts** regularly
5. **Track all adjustments** for audit compliance
6. **Reconcile physical counts** periodically
7. **Use location types appropriately** for routing logic
8. **Set realistic reorder points** for each product-location pair
