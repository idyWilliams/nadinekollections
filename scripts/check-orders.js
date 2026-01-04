const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkOrders() {
  console.log("Checking orders table (Service Role - RLS Bypassed)...");

  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error fetching order count:", error);
  } else {
    console.log(`Total Orders in DB: ${count}`);
  }
}

async function checkStock() {
  console.log("\n--- Checking Stock Levels ---");

  // 1. Check products count
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, title, stock')
    .limit(5);

  if (prodError) {
    console.error("Error fetching products stock:", prodError);
  } else {
    console.log("Sample Products Stock:", products);
  }

  // 2. Check variants count
  const { data: variants, error: varError } = await supabase
    .from('product_variants')
    .select('id, name, inventory_count, low_stock_threshold, product_id')
    .limit(5);

  if (varError) {
    console.error("Error fetching variants stock:", varError);
  } else {
    console.log("Sample Variants Stock:", variants);
  }

  // 3. Count products with stock < 10
  const { count: lowStockProducts, error: lpError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .lt('stock', 10);

  console.log(`Products with stock < 10: ${lowStockProducts}`);

  // 4. Count variants with inventory_count < 10
  const { count: lowStockVariants, error: lvError } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .lt('inventory_count', 10);

  console.log(`Variants with inventory_count < 10: ${lowStockVariants}`);
}

async function runDiagnostics() {
    await checkOrders();
    await checkStock();
}

runDiagnostics();
