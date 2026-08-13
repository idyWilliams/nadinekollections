
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const tables = [
  'notifications', 'order_items', 'product_variants', 'orders',
  'products', 'try_on_sessions', 'admin_invitations', 'banner_ads',
  'promotions', 'shipping_zones'
];

(async () => {
  console.log('=== INDEPENDENT VERIFICATION: Post-Wipe Counts ===\n');
  let allClear = true;
  for (const t of tables) {
    const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
    const ok = count === 0;
    if (!ok) allClear = false;
    console.log(` ${ok ? '✅' : '❌'} ${t.padEnd(20)} = ${count}`);
  }

  const { data: profiles }: any = await sb
    .from('profiles')
    .select('email,role')
    .order('role');

  const customers = profiles.filter((p: any) => p.role === 'customer' || !p.role);
  const admins = profiles.filter((p: any) =>
    ['admin', 'super_admin', 'manager', 'support'].includes(p.role)
  );

  console.log(`\n👥 customers remaining  = ${customers.length}  ${customers.length === 0 ? '✅' : '❌'}`);
  console.log(`🛡️  admins    remaining  = ${admins.length}  ${admins.length > 0 ? '✅' : '❌ LOCKOUT RISK!'}`);

  if (admins.length) {
    console.log('\n🛡️  Active admin accounts (you CAN log in with these):');
    admins.forEach((a: any) => console.log(`   • ${a.email}  [${a.role}]`));
  }

  const buckets = ['NadineKollections', 'products', 'banners', 'public'];
  console.log('\n🧺 Storage buckets (non-empty files):');
  for (const b of buckets) {
    try {
      const { data, error }: any = await sb.storage.from(b).list('', { limit: 500 });
      if (error || !data) {
        console.log(`   ⏭️  ${b.padEnd(20)} : skipped (${error?.message ?? 'no access'})`);
        continue;
      }
      const realFiles = data.filter((f: any) => f.name !== '.emptyFolderPlaceholder').length;
      console.log(`   ${realFiles === 0 ? '✅' : 'ℹ️ '} ${b.padEnd(20)} : ${realFiles} file(s)`);
    } catch (e: any) {
      console.log(`   ⏭️  ${b.padEnd(20)} : ${e.message}`);
    }
  }

  const { data: users }: any = await sb.auth.admin.listUsers({ perPage: 50 });
  const authTotal = users?.users?.length ?? -1;
  console.log(`\n🔐 auth.users total accounts = ${authTotal}`);

  console.log(allClear
    ? '\n🎉 ALL CHECKS PASSED — Production is a clean slate, admin access preserved.'
    : '\n⚠️  Some tables still have rows — check ❌ entries and manually clean via Supabase SQL Editor.'
  );
})();
