
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const BUCKET = 'NadineKollections';

async function dl(url: string): Promise<Buffer> {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120 Safari/537' },
    redirect: 'follow',
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.byteLength < 10_000) throw new Error('Too small: ' + b.byteLength);
  return b;
}

const FALLBACKS = [
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=85&w=2400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1617019114583-affb349e2bac?q=85&w=2400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=85&w=2400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=85&w=2400&auto=format&fit=crop',
];

async function dlWithFallback(primary: string): Promise<Buffer> {
  const urls = [primary, ...FALLBACKS];
  let lastErr: any;
  for (const u of urls) {
    try {
      return await dl(u);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('All URLs failed');
}

const MISSING_BANNER = {
  order: 5,
  title: 'End of Season Sale',
  subtitle: 'Up to 50% Off — Limited Stock',
  cta_text: 'Grab Deals',
  cta_link: '/shop/all',
  source_url:
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=85&w=2400&auto=format&fit=crop',
};

(async () => {
  const { data: now }: any = await sb
    .from('banner_ads')
    .select('id,display_order,title,image_url')
    .order('display_order');

  console.log('Current banners:\n');
  now.forEach((b) => console.log(`   order=${b.display_order}  "${b.title}"`));

  const existingSale = now.find((b) => b.title === MISSING_BANNER.title);
  if (existingSale) {
    console.log('\nℹ️  Sale banner already exists — skipping insert.');
  } else {
    console.log('\n🖼️  Adding missing Sale banner (display_order=5)...');
    let buf: Buffer;
    try {
      buf = await dlWithFallback(MISSING_BANNER.source_url);
      console.log(`   📥 downloaded ${(buf.byteLength / 1024).toFixed(0)} KB`);
    } catch (e) {
      console.error(`   ❌ download failed completely: ${(e as any).message}`);
      process.exit(1);
    }
    const slug = MISSING_BANNER.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const storagePath = `banners/hero-05-${slug}-${Date.now()
      .toString(36)
      .slice(-4)}.jpg`;
    const { error: upE } = await sb.storage.from(BUCKET).upload(storagePath, buf, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
      upsert: true,
    });
    if (upE) {
      console.error(`   ❌ storage: ${upE.message}`);
      process.exit(1);
    }
    const {
      data: { publicUrl },
    } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
    console.log(`   ☁️  stored at ${storagePath}`);

    const { error: dbE } = await sb.from('banner_ads').insert({
      title: MISSING_BANNER.title,
      subtitle: MISSING_BANNER.subtitle,
      image_url: publicUrl,
      cta_text: MISSING_BANNER.cta_text,
      cta_link: MISSING_BANNER.cta_link,
      display_order: MISSING_BANNER.order,
      is_active: true,
    });
    if (dbE) {
      console.error(`   ❌ DB: ${dbE.message}`);
      process.exit(1);
    }
    console.log('   ✅ Sale banner inserted.\n');
  }

  // Final report — verify exactly 6 active banners with contiguous display_order 1..6
  const { data: final, count }: any = await sb
    .from('banner_ads')
    .select('id,display_order,title,subtitle,cta_text,cta_link,image_url', { count: 'exact' })
    .eq('is_active', true)
    .order('display_order');

  console.log('='.repeat(60));
  console.log(`FINAL: ${count} active hero banners (expected: 6)`);
  console.log('='.repeat(60) + '\n');
  final.forEach((b: any) => {
    console.log(` ${String(b.display_order).padStart(2)}. "${b.title}"`);
    console.log(`     sub: "${b.subtitle}"`);
    console.log(`     cta: ${b.cta_text}  →  ${b.cta_link}`);
    console.log(`     url: ${b.image_url}`);
    console.log('');
  });

  const orders = final.map((b: any) => b.display_order).sort();
  const expected = [1, 2, 3, 4, 5, 6];
  const ok =
    orders.length === expected.length && orders.every((v: number, i: number) => v === expected[i]);
  console.log(ok
    ? '✅ SUCCESS: exactly 6 banners with contiguous display_order 1..6'
    : '⚠️  NOTE: orders not exactly 1..6 — check Admin panel');
  process.exit(ok ? 0 : 2);
})().catch((e) => {
  console.error('\n💥 FATAL:', e);
  process.exit(1);
});
