// src/scripts/setup-db.ts
import { initializeUserSchema, seedDatabase } from "../lib/seed";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Explicitly load the .env.local file
dotenv.config({ path: ".env.local" });

// Helper function to pause execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function autoSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!databaseUrl || !supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Skipping auto-setup: Missing Supabase credentials in .env.local");
    process.exit(0);
  }

  console.log("⏳ Starting automatic database initialization...");

  try {
    // 1. Create tables and trigger cache reload
    await initializeUserSchema(databaseUrl);

    // 2. Wait for PostgREST to finish refreshing its cache
    console.log("⏳ Waiting 3 seconds for Supabase schema cache to refresh...");
    await delay(3000); 

    // 3. Initialize a standard Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 4. Seed the data
    await seedDatabase(supabase);
    
    console.log("✅ Auto-setup complete. Starting Next.js server...\n");
  } catch (error) {
    console.error("❌ Auto-setup failed:", error);
    process.exit(1); 
  }
}

autoSetup();