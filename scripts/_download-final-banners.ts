
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const OUT = '/tmp/nk-final-banners';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const { data: list }: any = await sb
    .from('banner_ads')
    .select('display_order,title,subtitle,cta_text,cta_link,image_url')
    .eq('is_active', true)
    .order('display_order');

  console.log(`Downloading ${list.length} final banners to ${OUT} for visual check...\n`);
  for (const b of list) {
    const n = `${String(b.display_order).padStart(2, '0')}-${b.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}.jpg`;
    const fp = path.join(OUT, n);
    try {
      const r = await fetch(b.image_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120 Safari/537' },
      });
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(fp, buf);
      const kb = buf.byteLength / 1024;
      console.log(`${String(b.display_order).padStart(2)}. ${kb.toFixed(0).padStart(6)} KB  ${n}`);
      console.log(`     Title: "${b.title}"   Subtitle: "${b.subtitle}"`);
      console.log(`     CTA: ${b.cta_text} → ${b.cta_link}`);
    } catch (e) {
      console.log(`${b.display_order}. ❌ ${(e as any).message}`);
    }
  }
  console.log(`\n✅ done. Open ${OUT} to view images.`);
})();
