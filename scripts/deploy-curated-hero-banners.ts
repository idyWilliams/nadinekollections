
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'NadineKollections';

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type Banner = {
  order: number;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  source_url: string;
};

// Curated high-quality Unsplash / premium fashion images matching Nadine Kollections
// Each image is: 16:9 widescreen, editorial quality, matches the brand's warm palette,
// diverse Black/African models, with built-in negative-space for text overlay.
const BANNERS: Banner[] = [
  {
    order: 1,
    title: 'New Season, New You',
    subtitle: 'Autumn / Winter Collection 2026',
    cta_text: 'Shop New Arrivals',
    cta_link: '/shop/all',
    // Elegant Black woman in camel/cream coat, warm studio, perfect negative space
    source_url:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=2400&auto=format&fit=crop',
  },
  {
    order: 2,
    title: 'For the Modern Gentleman',
    subtitle: "Men's Tailoring & Essentials",
    cta_text: 'Shop Men',
    cta_link: '/shop/men',
    // Black man in tailored navy suit, warm tones, editorial shot
    source_url:
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=85&w=2400&auto=format&fit=crop',
  },
  {
    order: 3,
    title: 'Mini Style Icons',
    subtitle: 'Adorable Looks for Your Little Ones',
    cta_text: 'Shop Kids',
    cta_link: '/shop/kids',
    // Cute little Black girl in beautiful dress, soft warm tones
    source_url:
      'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=85&w=2400&auto=format&fit=crop',
  },
  {
    order: 4,
    title: 'Statement Accessories',
    subtitle: 'Gold · Bags · Sunglasses · Watches',
    cta_text: 'Discover Accessories',
    cta_link: '/shop/accessories',
    // Luxury flatlay: gold jewelry, handbag, sunglasses, watch, warm tones
    source_url:
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=85&w=2400&auto=format&fit=crop',
  },
  {
    order: 5,
    title: 'End of Season Sale',
    subtitle: 'Up to 50% Off — Limited Stock',
    cta_text: 'Grab Deals',
    cta_link: '/shop/all',
    // Two vibrant, smiling fashionable Black women, celebratory mood, color pops
    source_url:
      'https://images.unsplash.com/photo-1596993100576-b8b44d6a39a8?q=85&w=2400&auto=format&fit=crop',
  },
  {
    order: 6,
    title: 'The Complete Wardrobe',
    subtitle: 'From Head to Toe — Nadine Kollections',
    cta_text: 'Explore All Categories',
    cta_link: '/shop/all',
    // Elegant Black woman walking into luxury boutique, wardrobe/lifestyle scene
    source_url:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=85&w=2400&auto=format&fit=crop',
  },
];

async function downloadImage(url: string): Promise<Buffer> {
  const resp = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/jpeg,image/*;q=0.8',
    },
    redirect: 'follow',
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  if (buf.byteLength < 10_000) throw new Error(`Suspiciously small image: ${buf.byteLength} bytes`);
  return buf;
}

(async () => {
  console.log('='.repeat(70));
  console.log('  NADINE KOLLECTIONS — CURATED HERO BANNER SETUP');
  console.log('='.repeat(70) + '\n');

  // 1. Clean existing banners
  console.log('🧹 Cleaning existing banner_ads rows + storage files...');
  const { data: existing }: any = await sb.from('banner_ads').select('id,image_url');
  if (existing?.length) {
    const ids = existing.map((b: any) => b.id);
    const paths = existing
      .map((b: any) => {
        const needle = BUCKET + '/';
        const i = b.image_url.indexOf(needle);
        return i >= 0 ? (b.image_url as string).slice(i + needle.length) : null;
      })
      .filter(Boolean) as string[];
    await sb.from('banner_ads').delete().in('id', ids);
    if (paths.length) await sb.storage.from(BUCKET).remove(paths);
    console.log(`   → deleted ${ids.length} rows + ${paths.length} storage files\n`);
  }

  // 2. Download + upload each banner
  const created: any[] = [];
  for (let i = 0; i < BANNERS.length; i++) {
    const b = BANNERS[i];
    const idx = i + 1;
    const tag = `[${idx}/${BANNERS.length}]`;
    console.log(`${tag} 🖼️  "${b.title}"`);

    let imageBuffer: Buffer;
    try {
      process.stdout.write(`   📥 downloading source image...`);
      imageBuffer = await downloadImage(b.source_url);
      const kb = imageBuffer.byteLength / 1024;
      process.stdout.write(` OK (${kb.toFixed(0)} KB)\n`);
    } catch (e: any) {
      console.log(`   ❌ download FAILED: ${e.message}`);
      console.log(`      → Skipping this banner (you can retry later)\n`);
      continue;
    }

    const slug = b.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const storagePath = `banners/hero-${String(idx).padStart(2, '0')}-${slug}-${Date.now()
      .toString(36)
      .slice(-4)}.jpg`;

    try {
      process.stdout.write(`   ☁️  uploading → ${storagePath} ...`);
      const { error: upE } = await sb.storage.from(BUCKET).upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: true,
      });
      if (upE) throw new Error(upE.message);
      process.stdout.write(' OK\n');
    } catch (e: any) {
      console.log(`   ❌ upload FAILED: ${e.message}\n`);
      continue;
    }

    const {
      data: { publicUrl },
    } = sb.storage.from(BUCKET).getPublicUrl(storagePath);

    try {
      process.stdout.write(`   💾 saving to banner_ads table...`);
      const { data: inserted, error: dbE } = await sb
        .from('banner_ads')
        .insert({
          title: b.title,
          subtitle: b.subtitle,
          image_url: publicUrl,
          cta_text: b.cta_text,
          cta_link: b.cta_link,
          display_order: b.order,
          is_active: true,
        })
        .select()
        .single();
      if (dbE) throw new Error(dbE.message);
      process.stdout.write(` OK (id: ${(inserted as any).id.slice(0, 8)}...)\n`);
      created.push({ ...(inserted as any), storagePath });
    } catch (e: any) {
      console.log(`   ❌ DB FAILED: ${e.message}\n`);
      continue;
    }
    console.log(`   ✅ Banner ${idx} ready — display_order=${b.order}\n`);
  }

  // 3. Final report
  console.log('='.repeat(70));
  console.log(`  COMPLETE — ${created.length} / ${BANNERS.length} banners deployed to PRODUCTION`);
  console.log('='.repeat(70) + '\n');
  created.forEach((b, i) => {
    console.log(` ${String(i + 1).padStart(2)}. order=${b.display_order}  "${b.title}"`);
    console.log(`     sub: "${b.subtitle}"`);
    console.log(`     cta: ${b.cta_text}  →  ${b.cta_link}`);
    console.log(`     url: ${b.image_url}`);
    console.log('');
  });

  console.log('');
  console.log('👉 Hero banner carousel picks these up automatically via getActiveBanners()');
  console.log('👉 Manage them: Admin → Marketing → Hero Banners');
  console.log('');
  process.exit(0);
})().catch(e => {
  console.error('\n💥 FATAL:', e);
  process.exit(1);
});
