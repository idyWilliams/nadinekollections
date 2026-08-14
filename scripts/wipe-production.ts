
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const STORAGE_BUCKETS = ['NadineKollections', 'products', 'banners', 'public'];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function getCounts(): Promise<Record<string, number>> {
  const tables = [
    'notifications', 'order_items', 'product_variants',
    'orders', 'products', 'try_on_sessions', 'admin_invitations',
    'banner_ads', 'promotions', 'shipping_zones', 'profiles'
  ];
  const counts: Record<string, number> = {};
  for (const t of tables) {
    try {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      counts[t] = error ? -1 : (count ?? 0);
    } catch { counts[t] = -1; }
  }
  return counts;
}

async function tableCount(table: string): Promise<number> {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return count ?? 0;
}

async function truncateTable(table: string): Promise<{ ok: boolean; msg: string }> {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `TRUNCATE TABLE public.${table} RESTART IDENTITY CASCADE;`
    });
    if (error) {
      const { data, error: delErr } = await supabase.from(table).delete().gte('id', '00000000-0000-0000-0000-000000000000');
      if (delErr) return { ok: false, msg: `TRUNCATE+DELETE failed: ${error.message} / ${delErr.message}` };
      return { ok: true, msg: 'deleted (row-level delete, may not reset sequence)' };
    }
    return { ok: true, msg: 'truncated OK' };
  } catch (e: any) {
    return { ok: false, msg: `Exception: ${e.message}` };
  }
}

async function deleteCustomersPreserveAdmins(): Promise<{ deleted: number; kept: number }> {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('role', ['admin', 'super_admin', 'manager', 'support'])
    .eq('is_active', true)
    .is('deleted_at', null);

  const adminIds = (admins ?? []).map(a => a.id);
  console.log(`\n🛡️  Admins to preserve (${adminIds.length}):`);
  (admins ?? []).forEach(a => console.log(`   • ${a.email} [${a.role}]`));

  const { data: allUsers } = await supabase.auth.admin.listUsers();
  const allUserIds = allUsers.users.map(u => u.id);
  const customerIds = allUserIds.filter(id => !adminIds.includes(id));
  const customerCount = customerIds.length;

  for (const uid of customerIds) {
    try { await supabase.auth.admin.deleteUser(uid); }
    catch (e: any) { console.log(`   ⚠️  Failed to delete user ${uid}: ${e.message}`); }
  }

  const { error: profileDelError } = await supabase
    .from('profiles')
    .delete()
    .not('id', 'in', `(${adminIds.join(',')})`)
    .or(`role.eq.customer,role.is.null`);

  if (profileDelError) console.log(`   ⚠️  Profile cleanup warning: ${profileDelError.message}`);

  return { deleted: customerCount, kept: adminIds.length };
}

async function wipeStorageBuckets(): Promise<Record<string, { deleted: number; failed: number; err?: string }>> {
  const report: Record<string, { deleted: number; failed: number; err?: string }> = {};

  for (const bucketName of STORAGE_BUCKETS) {
    report[bucketName] = { deleted: 0, failed: 0 };
    try {
      const { data: files, error: listError } = await supabase.storage.from(bucketName).list('', { limit: 10000 });
      if (listError || !files) {
        report[bucketName].err = listError?.message ?? 'bucket missing';
        continue;
      }
      const paths = files.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => f.name);
      if (paths.length === 0) continue;

      for (const p of paths) {
        const { error } = await supabase.storage.from(bucketName).remove([p]);
        if (error) report[bucketName].failed++;
        else report[bucketName].deleted++;
      }
    } catch (e: any) {
      report[bucketName].err = e.message;
    }
  }
  return report;
}

async function main() {
  console.log('='.repeat(60));
  console.log('   ⚠️  PRODUCTION FULL WIPE SCRIPT — NADINE KOLLECTIONS');
  console.log('='.repeat(60));
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}\n`);

  const preCounts = await getCounts();
  console.log('📊 BEFORE — Record Counts:');
  Object.entries(preCounts).forEach(([k, v]) => console.log(`   ${k.padEnd(20)}: ${v < 0 ? 'ERROR' : v.toLocaleString()}`));

  console.log('\n--- PRE-FLIGHT CHECK ---');
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('role', ['admin', 'super_admin', 'manager', 'support'])
    .eq('is_active', true);

  if (!admins || admins.length === 0) {
    console.error('❌ FATAL: No active admins found. ABORTING — you will lock yourself out!');
    process.exit(2);
  }
  console.log(`✅ Found ${admins.length} active admin(s) — these will be PRESERVED:`);
  admins.forEach(a => console.log(`   • ${a.email} [${a.role}]`));

  const confirm1 = await ask('\n❓ Type "YESWIPE" to confirm wiping ALL production data (except admins): ');
  if (confirm1.trim() !== 'YESWIPE') { console.log('Cancelled.'); process.exit(0); }

  const confirm2 = await ask('❓ Type the project reference "' + SUPABASE_URL!.split('.')[0].replace('https://', '') + '" to CONFIRM: ');
  const expected = SUPABASE_URL!.split('.')[0].replace('https://', '');
  if (confirm2.trim() !== expected) { console.log('Project ref mismatch — Cancelled.'); process.exit(0); }

  console.log('\n🚨 COMMENCING WIPE IN 3 SECONDS — PRESS Ctrl+C NOW TO ABORT 🚨');
  await new Promise(r => setTimeout(r, 3000));

  // ===== STAGE 1: Transactional tables =====
  console.log('\n🧹 STAGE 1 / 3: Wiping transactional tables...');
  const deleteOrder = [
    'notifications', 'order_items', 'product_variants',
    'orders', 'products', 'try_on_sessions', 'admin_invitations',
    'banner_ads', 'promotions', 'shipping_zones'
  ];

  for (const tbl of deleteOrder) {
    // Use JS-level delete since RLS allows service role + simple id UUID range
    const { error } = await supabase.from(tbl).delete().not('id', 'is', null);
    const count = await tableCount(tbl);
    if (error) console.log(`   ⚠️  ${tbl.padEnd(20)}: WARN — ${error.message} (remaining: ${count})`);
    else console.log(`   ✅ ${tbl.padEnd(20)}: deleted → ${count} rows`);
  }

  // ===== STAGE 2: Customer accounts =====
  console.log('\n🧹 STAGE 2 / 3: Wiping customer accounts (preserving admins)...');
  const customers = await deleteCustomersPreserveAdmins();
  console.log(`   → Deleted ${customers.deleted} customer account(s), kept ${customers.kept} admin(s)`);

  // ===== STAGE 3: Storage =====
  console.log('\n🧹 STAGE 3 / 3: Wiping Storage buckets (product images)...');
  const storageReport = await wipeStorageBuckets();
  Object.entries(storageReport).forEach(([k, v]) => {
    if (v.err) console.log(`   ⚠️  bucket "${k}": skipped (${v.err})`);
    else console.log(`   ✅ bucket "${k}": deleted=${v.deleted}, failed=${v.failed}`);
  });

  // ===== FINAL REPORT =====
  console.log('\n' + '='.repeat(60));
  console.log('   ✅ WIPE COMPLETE — Final Counts:');
  console.log('='.repeat(60));
  const postCounts = await getCounts();
  Object.entries(postCounts).forEach(([k, v]) => {
    const before = preCounts[k] ?? 0;
    const mark = (v === 0 || (k === 'profiles' && v > 0)) ? '✅' : '❓';
    console.log(`   ${mark} ${k.padEnd(20)}: ${String(v < 0 ? 'ERROR' : v).padStart(8)}  (was ${before < 0 ? '?' : before.toLocaleString()})`);
  });

  const remainingAdmins = (await supabase.from('profiles').select('id,email,role').in('role', ['admin', 'super_admin', 'manager', 'support'])).data ?? [];
  console.log('\n🛡️  Remaining admins (you can still log in):');
  remainingAdmins.forEach((a: any) => console.log(`   • ${a.email} [${a.role}]`));

  console.log('\n🎉 Done. Next steps:');
  console.log('   1. Run "npm run dev" and log into /admin/login');
  console.log('   2. Add products via Admin → Products → New');
  console.log('   3. (Optional) Re-seed shipping_zones & banner_ads via Admin panel');

  rl.close();
}

main().catch(err => { console.error('\n💥 FATAL:', err); process.exit(1); });
