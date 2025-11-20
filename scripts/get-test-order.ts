
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTestOrder() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, total, order_status')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return;
  }

  if (data) {
    console.log('Found Order:');
    console.log(`Order ID (UUID): ${data.id}`);
    console.log(`Order Number: ${data.order_number}`);
    console.log(`Status: ${data.order_status}`);
    console.log(`Total: ${data.total}`);
  } else {
    console.log('No orders found in the database.');
  }
}

getTestOrder();
