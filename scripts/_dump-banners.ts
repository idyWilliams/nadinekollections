
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data: allB } = await sb.from('banner_ads').select('*').order('display_order');
  console.log('All banner_ads rows (total: ' + (allB?.length ?? 0) + '):\n');
  (allB ?? []).forEach((b, i) => {
    console.log(`${String(i + 1).padStart(2)}. [${b.is_active ? 'ACTIVE' : 'HIDDEN'}] order=${b.display_order}  id=${b.id.slice(0, 8)}...`);
    console.log(`    Title: "${b.title}"  Sub: "${b.subtitle}"`);
    console.log(`    CTA  : ${b.cta_text} → ${b.cta_link}`);
    console.log(`    Img  : ${b.image_url}`);
    console.log('');
  });
})();
