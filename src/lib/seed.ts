import { createClient } from "./supabase/server";

export async function seedDatabase() {
  const supabase = createClient();

  try {
    // Check if data already exists
    const { data: existingProducts } = await supabase
      .from("product")
      .select("id")
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      console.log("Database already seeded");
      return;
    }

    // Seed locations
    const { data: locations } = await supabase
      .from("location")
      .insert([
        {
          name: "Main Warehouse",
          type: "WAREHOUSE",
          capacity: 10000,
        },
        {
          name: "Retail Store - Downtown",
          type: "RETAIL",
          capacity: 500,
        },
        {
          name: "Dark Store - North",
          type: "DARK_STORE",
          capacity: 1000,
        },
      ])
      .select();

    // Seed products
    const { data: products } = await supabase
      .from("product")
      .insert([
        {
          sku: "PROD-001",
          name: "Laptop Computer",
          category: "Electronics",
          lead_time_days: 7,
          base_price: 999.99,
        },
        {
          sku: "PROD-002",
          name: "Wireless Mouse",
          category: "Accessories",
          lead_time_days: 3,
          base_price: 29.99,
        },
        {
          sku: "PROD-003",
          name: "USB-C Cable",
          category: "Cables",
          lead_time_days: 2,
          base_price: 12.99,
        },
        {
          sku: "PROD-004",
          name: "Monitor Stand",
          category: "Office",
          lead_time_days: 5,
          base_price: 49.99,
        },
        {
          sku: "PROD-005",
          name: "Keyboard Mechanical",
          category: "Accessories",
          lead_time_days: 4,
          base_price: 149.99,
        },
      ])
      .select();

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

      await supabase.from("inventory").insert(inventoryData);
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
