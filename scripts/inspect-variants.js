const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectVariants() {
  console.log("Inspecting product_variants...");

  // 1. Get one row to see columns
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching variant:", error);
  } else {
    console.log("Sample Variant Data:", data);
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No variants found in table.");
    }
  }

  // 2. Count total variants
  const { count, error: countError } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true });

  console.log(`Total Variants in DB: ${count}`);
}

inspectVariants();
