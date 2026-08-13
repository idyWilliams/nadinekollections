
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const B = 'NadineKollections';
const PATHS = ['', 'products/', 'banners/', 'products/variants/'];

(async () => {
  console.log(`🧹 Final deep-sweep of "${B}" bucket — all nested paths\n`);
  let total = 0;
  const toDel: string[] = [];
  for (const p of PATHS) {
    const { data } = await sb.storage.from(B).list(p, { limit: 5000 });
    const real = (data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder');
    const files = real.filter(f => f.id !== null && f.metadata !== null && f.metadata !== undefined);
    files.forEach(f => toDel.push(p + f.name));
    total += files.length;
    const folders = real.filter(f => f.id === null || f.metadata === null || f.metadata === undefined);
    const plabel = (p === '' ? '<root>' : p).padEnd(22);
    console.log(`   📁 ${plabel}: ${String(files.length).padStart(3)} file(s),  ${folders.length} folder(s)`);
    if (files.length) files.slice(0, 4).forEach(f => console.log(`        • ${f.name}`));
    if (files.length > 4) console.log(`        ... +${files.length - 4} more in this folder`);
  }

  console.log(`\n📊 TOTAL files found: ${total}`);
  if (total === 0) {
    console.log('🎉 STORAGE IS 100% CLEAN — No product or banner images remain.');
    process.exit(0);
  }
  console.log(`🗑️  Removing ${toDel.length} leftover image(s)...`);
  let ok = 0;
  for (let i = 0; i < toDel.length; i += 100) {
    const { error } = await sb.storage.from(B).remove(toDel.slice(i, i + 100));
    if (error) console.log(`   ❌ batch ${Math.floor(i / 100) + 1}: ${error.message}`);
    else ok += Math.min(100, toDel.length - i);
  }
  console.log(`✅ done: deleted ${ok} / ${toDel.length}\n`);
})();
