// Quick test script to verify variant data structure
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVariants() {
  console.log('Testing variant data fetching...\n');

  // Test 1: Fetch products with variants
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      variants:product_variants(*)
    `)
    .limit(5);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products`);

  products.forEach((product, index) => {
    console.log(`\n${index + 1}. ${product.title}`);
    if (product.variants && product.variants.length > 0) {
      console.log(`   ✓ Has ${product.variants.length} variant(s):`);
      product.variants.forEach(v => {
        console.log(`     - ${v.name}: ${v.inventory_count} in stock (hex: ${v.attributes?.hex || 'N/A'})`);
      });
    } else {
      console.log('   ✗ No variants');
    }
  });
}

testVariants().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
