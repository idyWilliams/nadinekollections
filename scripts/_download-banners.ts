
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

const OUT_DIR = '/tmp/nadine-banners';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const { data: banners }: any = await sb
    .from('banner_ads')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  console.log(`Downloading ${banners.length} banners for visual check → ${OUT_DIR}\n`);
  for (let i = 0; i < banners.length; i++) {
    const b = banners[i];
    const idx = i + 1;
    const name = `${String(idx).padStart(2, '0')}-${b.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}.jpg`;
    const file = path.join(OUT_DIR, name);
    try {
      const resp = await fetch(b.image_url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const buf = Buffer.from(await resp.arrayBuffer());
      fs.writeFileSync(file, buf);
      const kb = buf.length / 1024;
      console.log(`${idx}. OK  ${kb.toFixed(0).padStart(6)} KB   ${name}`);
      console.log(`     Title: "${b.title}"  |  Sub: "${b.subtitle}"`);
    } catch (e: any) {
      console.log(`${idx}. FAIL ${e.message}  ${name}`);
    }
  }
  console.log(`\n✅ Done. Open folder to view: ${OUT_DIR}`);
})();
