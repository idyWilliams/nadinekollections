
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'NadineKollections';
const PREFIXES = ['', 'products/', 'banners/'];

(async () => {
  console.log(`🧺 Inspecting "${BUCKET}" storage bucket recursively...\n`);
  const allFiles: string[] = [];

  for (const prefix of PREFIXES) {
    const label = prefix === '' ? '<root>' : prefix;
    const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: 5000 });
    if (error) {
      console.log(`  ⏭️  ${label} — error: ${error.message}\n`);
      continue;
    }
    const items = (data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder');
    console.log(`  📁 ${BUCKET}/${label}  →  ${items.length} item(s)`);
    for (const it of items) {
      const path = prefix + it.name;
      const isFolder = it.id === null || it.metadata === null || it.metadata === undefined;
      console.log(`       ${isFolder ? '📂' : '📄'} ${it.name}${isFolder ? ' [FOLDER]' : '  ' + (it.metadata?.size ?? '?') + ' bytes'}`);
      if (!isFolder) allFiles.push(path);
    }
    console.log('');
  }

  console.log(`Total deletable files remaining: ${allFiles.length}`);
  if (allFiles.length === 0) {
    console.log('✅ Storage is clean — no product/banner images left.');
    process.exit(0);
  }

  console.log(`\n🗑️  Deleting ${allFiles.length} leftover file(s)...`);
  const BATCH = 100;
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < allFiles.length; i += BATCH) {
    const batch = allFiles.slice(i, i + BATCH);
    const { error } = await sb.storage.from(BUCKET).remove(batch);
    if (error) { fail += batch.length; console.log(`   ❌ batch ${i/BATCH+1}: ${error.message}`); }
    else { ok += batch.length; }
  }
  console.log(`   done — deleted ${ok}, failed ${fail}\n`);
  process.exit(fail ? 1 : 0);
})();
