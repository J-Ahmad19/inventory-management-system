import { Client } from "pg";

interface BYODSetupConfig {
  databaseUrl: string;       // Direct Postgres URI (e.g., postgresql://postgres:[password]...)
  supabaseUrl: string;       // App API URL
  supabaseAnonKey: string;   // App Anon/Service Key
}

/**
 * Connects directly to the user's raw Postgres instance to provision tables
 * matching the schema requirements of the application.
 */
export async function initializeUserSchema(databaseUrl: string) {
  const pgClient = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Required for Supabase external connections
  });

  try {
    await pgClient.connect();
    console.log("Connecting directly to user database to verify tables...");

    // Execute raw SQL matching your exact TypeScript interface definitions
    await pgClient.query(`
      -- 1. Location Table
      CREATE TABLE IF NOT EXISTS location (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Product Table
      CREATE TABLE IF NOT EXISTS product (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        lead_time_days INTEGER NOT NULL,
        base_price NUMERIC NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. Inventory Table
      CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES product(id) ON DELETE CASCADE,
        location_id UUID REFERENCES location(id) ON DELETE CASCADE,
        qty_on_hand INTEGER NOT NULL DEFAULT 0,
        qty_allocated INTEGER NOT NULL DEFAULT 0,
        reorder_point INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 4. Transaction Ledger Table
      CREATE TABLE IF NOT EXISTS transaction_ledger (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        product_id UUID REFERENCES product(id) ON DELETE CASCADE,
        from_location UUID REFERENCES location(id) ON DELETE SET NULL,
        to_location UUID REFERENCES location(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        reason TEXT,
        initiated_by TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      -- 5. Alerts Table
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        product_id UUID REFERENCES product(id) ON DELETE CASCADE,
        location_id UUID REFERENCES location(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        days_until_stockout INTEGER,
        recommended_order_qty INTEGER,
        confidence_score NUMERIC,
        acknowledged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Force PostgREST to reload the schema cache immediately
      NOTIFY pgrst, 'reload schema';
    `);

    console.log("✅ User database tables provisioned successfully.");
  } catch (error) {
    console.error("❌ Failed to run raw SQL schema initialization:", error);
    throw error;
  } finally {
    await pgClient.end();
  }
}

/**
 * Seeds the dynamically connected database with dummy inventory records
 */
export async function seedDatabase(supabaseClient: any) {
  try {
    // Check if data already exists
    const { data: existingProducts, error: checkError } = await supabaseClient
      .from("product")
      .select("id")
      .limit(1);
      
    if (checkError) throw checkError;

    if (existingProducts && existingProducts.length > 0) {
      console.log("Database already seeded");
      return;
    }

    // Seed locations
    const { data: locations, error: locError } = await supabaseClient
      .from("location")
      .insert([
        { name: "Main Warehouse", type: "WAREHOUSE", capacity: 10000 },
        { name: "Retail Store - Downtown", type: "RETAIL", capacity: 500 },
        { name: "Dark Store - North", type: "DARK_STORE", capacity: 1000 },
      ])
      .select();

    if (locError) throw locError;

    // Seed products
    const { data: products, error: prodError } = await supabaseClient
      .from("product")
      .insert([
        { sku: "PROD-001", name: "Laptop Computer", category: "Electronics", lead_time_days: 7, base_price: 999.99 },
        { sku: "PROD-002", name: "Wireless Mouse", category: "Accessories", lead_time_days: 3, base_price: 29.99 },
        { sku: "PROD-003", name: "USB-C Cable", category: "Cables", lead_time_days: 2, base_price: 12.99 },
        { sku: "PROD-004", name: "Monitor Stand", category: "Office", lead_time_days: 5, base_price: 49.99 },
        { sku: "PROD-005", name: "Keyboard Mechanical", category: "Accessories", lead_time_days: 4, base_price: 149.99 },
      ])
      .select();

    if (prodError) throw prodError;

    // Seed inventory levels
    if (locations && products) {
      const inventoryData = [];
      for (const location of locations) {
        for (const product of products) {
          inventoryData.push({
            product_id: product.id,
            location_id: location.id,
            qty_on_hand: Math.floor(Math.random() * 500) + 10,
            qty_allocated: Math.floor(Math.random() * 100),
            reorder_point: 50,
          });
        }
      }

      const { error: invError } = await supabaseClient.from("inventory").insert(inventoryData);
      if (invError) throw invError;
    }

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}