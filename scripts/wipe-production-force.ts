
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const PROJECT_REF = SUPABASE_URL.split('.')[0].replace('https://', '');
const STORAGE_BUCKETS = ['NadineKollections', 'products', 'banners', 'public'];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function tableCount(table: string): Promise<number> {
  try {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    return error ? -1 : (count ?? 0);
  } catch { return -1; }
}

async function getCounts(): Promise<Record<string, number>> {
  const tables = [
    'notifications', 'order_items', 'product_variants',
    'orders', 'products', 'try_on_sessions', 'admin_invitations',
    'banner_ads', 'promotions', 'shipping_zones', 'profiles'
  ];
  const counts: Record<string, number> = {};
  for (const t of tables) counts[t] = await tableCount(t);
  return counts;
}

async function wipeTable(tbl: string): Promise<number> {
  try {
    const { error } = await supabase.from(tbl).delete().not('id', 'is', null);
    if (error) {
      console.log(`   ⚠️  ${tbl.padEnd(20)} — WARN: ${error.message}`);
    }
  } catch (e: any) {
    console.log(`   ⚠️  ${tbl.padEnd(20)} — EXCEPTION: ${e.message}`);
  }
  return await tableCount(tbl);
}

async function deleteCustomersPreserveAdmins(): Promise<{ deleted: number; kept: number; keptList: string[] }> {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('role', ['admin', 'super_admin', 'manager', 'support'])
    .eq('is_active', true)
    .is('deleted_at', null);

  const adminIds = (admins ?? []).map(a => a.id);
  const keptList = (admins ?? []).map(a => `${a.email} [${a.role}]`);

  console.log(`\n🛡️  Admins to preserve (${adminIds.length}):`);
  keptList.forEach(a => console.log(`   • ${a}`));

  const { data: listResp, error: listErr }: any = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.log(`   ⚠️  Failed to list auth users: ${listErr.message} — trying auth API directly`);
  }
  const allUsers: any[] = listResp?.users ?? [];
  let deleted = 0;

  for (const u of allUsers) {
    if (adminIds.includes(u.id)) continue;
    try {
      await supabase.auth.admin.deleteUser(u.id);
      deleted++;
    } catch (e: any) {
      console.log(`   ⚠️  deleteUser(${u.email ?? u.id}): ${e.message}`);
    }
  }

  try {
    const { error: pDelErr } = await supabase
      .from('profiles')
      .delete()
      .or(`role.eq.customer,role.is.null,role.eq.${null}`);
    if (pDelErr) console.log(`   ⚠️  profile-cleanup: ${pDelErr.message}`);
  } catch (e: any) {
    console.log(`   ⚠️  profile-cleanup-ex: ${e.message}`);
  }

  return { deleted, kept: adminIds.length, keptList };
}

async function wipeStorageBuckets(): Promise<Record<string, { deleted: number; failed: number; err?: string }>> {
  const report: Record<string, { deleted: number; failed: number; err?: string }> = {};
  for (const bucketName of STORAGE_BUCKETS) {
    report[bucketName] = { deleted: 0, failed: 0 };
    try {
      const { data: files, error: listError } = await supabase.storage.from(bucketName).list('', { limit: 5000 });
      if (listError || !files) {
        report[bucketName].err = listError?.message ?? 'bucket missing/unavailable';
        continue;
      }
      const nonEmpty = files.filter(f => f.name !== '.emptyFolderPlaceholder');
      for (const f of nonEmpty) {
        const { error } = await supabase.storage.from(bucketName).remove([f.name]);
        if (error) report[bucketName].failed++;
        else report[bucketName].deleted++;
      }
    } catch (e: any) {
      report[bucketName].err = e.message;
    }
  }
  return report;
}

async function resetSequences() {
  const seqs = [
    'notifications_id_seq', 'order_items_id_seq', 'product_variants_id_seq',
    'orders_id_seq', 'products_id_seq', 'try_on_sessions_id_seq',
    'admin_invitations_id_seq', 'banner_ads_id_seq', 'promotions_id_seq',
    'shipping_zones_id_seq'
  ];
  for (const s of seqs) {
    try {
      await supabase.rpc('exec_sql', { sql: `ALTER SEQUENCE IF EXISTS public.${s} RESTART;` });
    } catch { /* ignore — RPC may not exist, sequences are cosmetic */ }
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('   ⚠️⚠️⚠️  NON-INTERACTIVE PRODUCTION FULL WIPE  ⚠️⚠️⚠️');
  console.log('='.repeat(70));
  console.log(`🔗 Project : ${PROJECT_REF}`);
  console.log(`🔗 URL     : ${SUPABASE_URL}`);
  console.log(`🕒 Started : ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  const preCounts = await getCounts();
  console.log('\n📊 RECORD COUNTS — BEFORE WIPE:');
  for (const [k, v] of Object.entries(preCounts)) {
    console.log(`   ${k.padEnd(20)}: ${v < 0 ? 'ERROR' : v.toLocaleString().padStart(10)}`);
  }

  console.log('\n--- PRE-FLIGHT ADMIN CHECK ---');
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('role', ['admin', 'super_admin', 'manager', 'support'])
    .eq('is_active', true);

  if (!admins || admins.length === 0) {
    console.error('❌❌❌  FATAL: No active admins found! ABORTING to prevent lock-out.');
    console.error('      Create an admin in Supabase Auth > Users first, label profile role=admin.');
    process.exit(2);
  }
  console.log(`✅ ${admins.length} active admin(s) confirmed — these will NOT be deleted:`);
  admins.forEach(a => console.log(`   • ${a.email}  [${a.role}]  id=${a.id?.slice(0, 8)}...`));

  console.log('\n⏳ Commencing wipe in 5 seconds (data will be PERMANENTLY lost)...');
  await new Promise(r => setTimeout(r, 5000));

  // ===== STAGE 1: Transactional tables =====
  console.log('\n🧹 STAGE 1/3 — Transactional tables (delete rows):');
  const deleteOrder = [
    'notifications', 'order_items', 'product_variants',
    'orders', 'products', 'try_on_sessions', 'admin_invitations',
    'banner_ads', 'promotions', 'shipping_zones'
  ];
  for (const tbl of deleteOrder) {
    const remaining = await wipeTable(tbl);
    const icon = remaining === 0 ? '✅' : (remaining < 0 ? '❌' : '⚠️ ');
    console.log(`   ${icon} ${tbl.padEnd(20)} — remaining: ${remaining < 0 ? 'ERROR' : remaining}`);
  }

  // ===== STAGE 2: Customer auth =====
  console.log('\n🧹 STAGE 2/3 — Customer auth accounts (admins preserved):');
  const { deleted, kept, keptList } = await deleteCustomersPreserveAdmins();
  console.log(`   📊 Removed ${deleted} customer auth account(s). Kept ${kept} admin(s).`);

  // ===== STAGE 3: Storage =====
  console.log('\n🧹 STAGE 3/3 — Storage buckets (product images):');
  const storageReport = await wipeStorageBuckets();
  for (const [k, v] of Object.entries(storageReport)) {
    if (v.err) console.log(`   ⏭️  bucket "${k}": skipped — ${v.err}`);
    else console.log(`   ✅ bucket "${k}": deleted ${v.deleted} file(s), ${v.failed} failed`);
  }

  // ===== Sequence reset =====
  console.log('\n🔄 Resetting sequences (best-effort)...');
  await resetSequences();
  console.log('   done');

  // ===== FINAL REPORT =====
  console.log('\n' + '='.repeat(70));
  console.log('   ✅ WIPE COMPLETE — FINAL RECORD COUNTS:');
  console.log('='.repeat(70));
  const postCounts = await getCounts();
  for (const [k, v] of Object.entries(postCounts)) {
    const before = preCounts[k] ?? 0;
    const expectedZero = k !== 'profiles';
    let icon: string;
    if (v < 0) icon = '❌';
    else if (expectedZero) icon = v === 0 ? '✅' : '⚠️ ';
    else icon = '✅';
    const beforeStr = before < 0 ? '?' : before.toLocaleString();
    const afterStr = v < 0 ? 'ERROR' : v.toLocaleString();
    console.log(`   ${icon} ${k.padEnd(20)}: ${afterStr.padStart(10)}   (was ${beforeStr.padStart(10)})`);
  }

  const remAdmins: any = (await supabase.from('profiles').select('email,role')
    .in('role', ['admin', 'super_admin', 'manager', 'support'])).data;
  console.log('\n🛡️  Remaining admin accounts (log in at /admin/login):');
  (remAdmins ?? keptList).forEach((a: any) =>
    console.log(`   • ${typeof a === 'string' ? a : `${a.email}  [${a.role}]`}`));

  console.log('\n🎉 NADINE KOLLECTIONS — PRODUCTION WIPE SUCCESSFUL');
  console.log(`   Completed at: ${new Date().toISOString()}`);
  console.log('\n   Next steps:');
  console.log('   1. Re-create at least 1 shipping zone (Admin → Settings)');
  console.log('   2. Add banner ads as needed (Admin → Marketing)');
  console.log('   3. Add your new products (Admin → Products → New)');
  console.log('   4. Test checkout flow end-to-end with a dummy order\n');

  process.exit(0);
}

main().catch(err => {
  console.error('\n💥💥💥  FATAL ERROR during wipe — check state manually in Supabase Dashboard:\n', err);
  process.exit(1);
});
