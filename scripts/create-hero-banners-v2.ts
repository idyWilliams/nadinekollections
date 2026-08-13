
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const IMG_API = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image';
const SIZE = 'landscape_16_9';
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
  prompt: string;
};

// Enhanced prompts for stronger visual consistency and brand fit
const BANNERS: Banner[] = [
  {
    order: 1,
    title: 'New Season, New You',
    subtitle: 'Autumn / Winter Collection 2026',
    cta_text: 'Shop New Arrivals',
    cta_link: '/shop/all',
    prompt:
      'high end luxury fashion editorial photo, beautiful elegant Nigerian African woman model in rich warm chocolate brown wool coat with gold button details, cream silk turtleneck, gold jewelry, standing in warm minimalist studio with beige background, soft natural side lighting from large window, confident powerful pose looking off camera, premium vogue magazine photography, sharp focus on clothing texture, warm neutral earth tones palette, widescreen 16:9, leave empty space on right third for text overlay, cinematic, 8k, ultra realistic',
  },
  {
    order: 2,
    title: 'For the Modern Gentleman',
    subtitle: "Men's Tailoring & Essentials",
    cta_text: 'Shop Men',
    cta_link: '/shop/men',
    prompt:
      'premium luxury menswear campaign photo, handsome stylish Black African man model wearing perfectly tailored charcoal grey two piece suit, crisp white dress shirt unbuttoned at collar, gold automatic watch on wrist, black leather loafers, leaning confidently against warm textured cream wall, soft natural daylight, refined knowing smile, high end gq magazine quality, warm neutral beige and grey palette, widescreen 16:9 composition, leave empty space on left side for marketing copy, ultra realistic detailed, 8k cinematic',
  },
  {
    order: 3,
    title: 'Mini Style Icons',
    subtitle: 'Adorable Looks for Your Little Ones',
    cta_text: 'Shop Kids',
    cta_link: '/shop/kids',
    prompt:
      'luxury kids fashion editorial, adorable happy smiling African Nigerian girl age 5 wearing beautiful soft blush pink princess dress with tulle skirt and matching satin hair bow, white leather mary jane shoes, standing on soft cream fluffy rug in bright minimalist sunlit playroom, gold handbag by her side, candid joyful expression, premium child fashion campaign photography, warm soft pastel cream and pink palette, widescreen 16:9, leave empty right side for title text, ultra realistic high quality, 8k',
  },
  {
    order: 4,
    title: 'Statement Accessories',
    subtitle: 'Gold · Bags · Sunglasses · Watches',
    cta_text: 'Discover Accessories',
    cta_link: '/shop/accessories',
    prompt:
      'high end luxury accessories flat lay composition, elegant gold layered necklaces and earrings, designer camel brown leather structured handbag, oversized tortoise shell sunglasses, classic gold dress watch, cream silk scarf, arranged artistically on warm polished beige marble surface with soft directional shadows, warm natural side light, editorial product photography for luxury fashion brand, widescreen 16:9, top down view, leave empty center top space for marketing text, warm nude cocoa and gold color palette, ultra detailed sharp 8k',
  },
  {
    order: 5,
    title: 'End of Season Sale',
    subtitle: 'Up to 50% Off — Limited Stock',
    cta_text: 'Grab Deals',
    cta_link: '/shop/all',
    prompt:
      'vibrant luxury fashion sale campaign, two stunning happy African women fashion models laughing and walking together, one in vibrant burnt orange silk slip dress, one in deep emerald green tailored jumpsuit, gold statement jewelry, dynamic candid motion shot against clean warm off white seamless studio background, soft golden rim lighting, celebration mood, high fashion editorial, 16:9 widescreen, leave generous empty central space for sale headline text, pops of orange and green against cream background, ultra realistic cinematic 8k',
  },
  {
    order: 6,
    title: 'The Complete Wardrobe',
    subtitle: 'From Head to Toe — Nadine Kollections',
    cta_text: 'Explore All Categories',
    cta_link: '/shop/all',
    prompt:
      'elegant luxury fashion boutique entrance scene, beautiful sophisticated African woman in flowing cream maxi dress walking into minimalist designer boutique, holding structured tan leather designer tote bag, wearing layered gold necklaces and nude strappy heeled sandals, background of warm oak clothing racks with curated luxury garments neatly hung, warm ambient store lighting, sophisticated premium lifestyle photography, widescreen 16:9, leave clean upper center area for headline text, warm cocoa cream wood and gold palette, ultra realistic cinematic, 8k',
  },
];

const isPlaceholder = (buf: Buffer): boolean => {
  const str = buf.toString('utf8', 0, 400);
  return /refresh|generating|please refresh|image is generating/i.test(str);
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchBannerImage(prompt: string, idx: number, total: number): Promise<Buffer> {
  const url = `${IMG_API}?image_size=${SIZE}&prompt=${encodeURIComponent(prompt)}`;
  const tag = `[${idx}/${total}]`;
  let attempt = 0;
  const MAX_ATTEMPTS = 6;
  while (attempt++ < MAX_ATTEMPTS) {
    process.stdout.write(`   ${tag} attempt ${attempt}/${MAX_ATTEMPTS} → `);
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        process.stdout.write(`HTTP ${resp.status} — retry in 8s\n`);
        await sleep(8000);
        continue;
      }
      const buf = Buffer.from(await resp.arrayBuffer());
      if (isPlaceholder(buf)) {
        process.stdout.write(`loading placeholder — wait 6s\n`);
        await sleep(6000);
        continue;
      }
      process.stdout.write(`OK — ${(buf.byteLength / 1024).toFixed(0)} KB\n`);
      if (buf.byteLength < 20_000) {
        process.stdout.write(`   ⚠️  small file (suspicious) — retry\n`);
        await sleep(4000);
        continue;
      }
      return buf;
    } catch (e: any) {
      process.stdout.write(`ERR ${e.message} — retry 5s\n`);
      await sleep(5000);
    }
  }
  throw new Error(`Failed after ${MAX_ATTEMPTS} attempts`);
}

(async () => {
  console.log('='.repeat(70));
  console.log('  NADINE KOLLECTIONS — HERO BANNERS (retry-aware regenerator)');
  console.log('='.repeat(70));
  console.log('');

  // Wipe existing banner_ads rows + storage files for clean start
  console.log('🧹 Cleaning existing banner rows and storage files...');
  const { data: existing }: any = await sb.from('banner_ads').select('id,image_url');
  if (existing && existing.length) {
    const ids = existing.map((b: any) => b.id);
    const storagePaths = existing
      .map((b: any) => {
        const n = 'NadineKollections/';
        const i = b.image_url.indexOf(n);
        return i >= 0 ? b.image_url.slice(i + n.length) : null;
      })
      .filter(Boolean);
    await sb.from('banner_ads').delete().in('id', ids);
    if (storagePaths.length) await sb.storage.from(BUCKET).remove(storagePaths);
    console.log(`   → deleted ${ids.length} rows, ${storagePaths.length} storage files\n`);
  }

  let created = 0;
  for (let i = 0; i < BANNERS.length; i++) {
    const b = BANNERS[i];
    const idx = i + 1;
    const tag = `(${idx}/${BANNERS.length})`;
    console.log(`${tag} 🎨 "${b.title}"`);

    let imageBuffer: Buffer;
    try {
      imageBuffer = await fetchBannerImage(b.prompt, idx, BANNERS.length);
    } catch (e: any) {
      console.log(`   ❌ Giving up: ${e.message}\n`);
      continue;
    }

    const fname = `banners/hero-${String(idx).padStart(2, '0')}-${Date.now().toString(36)}.jpg`;
    process.stdout.write(`   ☁️  Uploading ${fname} → `);
    const { error: upE } = await sb.storage.from(BUCKET).upload(fname, imageBuffer, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
      upsert: true,
    });
    if (upE) {
      console.log(`FAIL ${upE.message}\n`);
      continue;
    }
    const {
      data: { publicUrl },
    } = sb.storage.from(BUCKET).getPublicUrl(fname);
    console.log(`OK`);

    process.stdout.write(`   💾 Saving to banner_ads DB → `);
    const { error: dbE } = await sb.from('banner_ads').insert({
      title: b.title,
      subtitle: b.subtitle,
      image_url: publicUrl,
      cta_text: b.cta_text,
      cta_link: b.cta_link,
      display_order: b.order,
      is_active: true,
    });
    if (dbE) {
      console.log(`FAIL ${dbE.message}\n`);
      continue;
    }
    console.log(`OK`);
    created++;
    console.log(`   ✅ Banner ready — order=${b.order}\n`);
  }

  const { count: finalCount, data: finalBanners }: any = await sb
    .from('banner_ads')
    .select('id,title,subtitle,cta_text,cta_link,display_order,image_url')
    .eq('is_active', true)
    .order('display_order', { count: 'exact' });

  console.log('='.repeat(70));
  console.log(`  DONE — ${created}/${BANNERS.length} banners created. Active total: ${finalCount}`);
  console.log('='.repeat(70) + '\n');
  (finalBanners ?? []).forEach((b: any, i: number) => {
    console.log(` ${String(i + 1).padStart(2)}. order=${b.display_order}  "${b.title}"`);
    console.log(`     sub: "${b.subtitle}"`);
    console.log(`     cta: ${b.cta_text} → ${b.cta_link}`);
    console.log(`     img: ${b.image_url}\n`);
  });

  process.exit(0);
})().catch(e => {
  console.error('\n💥 FATAL:', e);
  process.exit(1);
});
