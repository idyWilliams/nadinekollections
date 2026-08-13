
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'NadineKollections';

(async () => {
  const { data: allB }: any = await sb
    .from('banner_ads')
    .select('*')
    .order('created_at', { ascending: true });

  console.log('Total rows found:', allB.length);

  const byTitle = new Map<string, any[]>();
  for (const b of allB) {
    const k = b.title ?? 'untitled';
    if (!byTitle.has(k)) byTitle.set(k, []);
    byTitle.get(k)!.push(b);
  }

  const toDeleteIds: string[] = [];
  const toDeleteStorage: string[] = [];

  for (const [title, list] of byTitle.entries()) {
    if (list.length <= 1) continue;
    list.sort(
      (a, b) =>
        (new Date(b.created_at) as unknown as number) -
        (new Date(a.created_at) as unknown as number)
    );
    const keep = list[0];
    const del = list.slice(1);
    console.log(`\n"${title}" — keep ${keep.id.slice(0, 8)} (${keep.created_at})`);
    for (const d of del) {
      console.log(`   DEL ${d.id.slice(0, 8)} (${d.created_at})`);
      toDeleteIds.push(d.id);
      try {
        const needle = BUCKET + '/';
        const idx = d.image_url.indexOf(needle);
        if (idx >= 0) toDeleteStorage.push(d.image_url.slice(idx + needle.length));
      } catch {}
    }
  }

  if (toDeleteIds.length === 0) {
    console.log('\n✅ No duplicates. Done.');
  } else {
    console.log(`\nDeleting ${toDeleteIds.length} duplicate rows...`);
    const { error: dbE } = await sb.from('banner_ads').delete().in('id', toDeleteIds);
    if (dbE) console.error('  DB err:', dbE.message);
    else console.log('  DB rows deleted.');

    if (toDeleteStorage.length) {
      console.log(`Deleting ${toDeleteStorage.length} storage files...`);
      toDeleteStorage.forEach(s => console.log('   -', s));
      const { error: sE } = await sb.storage.from(BUCKET).remove(toDeleteStorage);
      if (sE) console.error('  Storage err:', sE.message);
      else console.log('  Storage files deleted.');
    }
  }

  const { count: finalCount, data: final }: any = await sb
    .from('banner_ads')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('display_order');

  console.log('\n' + '='.repeat(60));
  console.log(`FINAL: ${finalCount} active hero banners\n`);
  final.forEach((b: any, i: number) => {
    console.log(`${String(i + 1).padStart(2)}. order=${b.display_order}  "${b.title}"`);
    console.log(`    sub: "${b.subtitle}"`);
    console.log(`    cta: ${b.cta_text} → ${b.cta_link}`);
  });
  process.exit(0);
})();
