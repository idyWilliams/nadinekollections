
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}

const IMG_API_PREFIX = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image';

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type BannerDef = {
  display_order: number;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  prompt: string;
};

const BANNERS: BannerDef[] = [
  {
    display_order: 1,
    title: 'New Season, New You',
    subtitle: 'Autumn / Winter Collection 2026',
    cta_text: 'Shop New Arrivals',
    cta_link: '/shop/all',
    prompt:
      'Ultra high-fashion editorial banner, elegant African Nigerian woman wearing a luxurious rich chocolate brown tailored coat with gold buttons, cream turtleneck, standing in warm minimalist studio with soft beige background, soft natural side lighting, confident pose, premium fashion photography, 4k, 16:9 widescreen, no text overlay, leave clean center/right space for text, warm earth tones nude cream palette, luxury magazine aesthetic, sharp focus on face and outfit',
  },
  {
    display_order: 2,
    title: 'For the Modern Gentleman',
    subtitle: 'Men\u2019s Tailoring & Essentials',
    cta_text: 'Shop Men',
    cta_link: '/shop/men',
    prompt:
      'Premium menswear fashion banner, handsome stylish Black African man in a perfectly fitted charcoal grey suit with white dress shirt, gold wristwatch, leaning casually against warm textured cream white wall, natural window light, refined sophisticated smile, high-end editorial photography, 4k 16:9 widescreen, no text, leave generous left or center space for copy, warm nude neutral tones palette, luxury menswear brand campaign, sharp focus',
  },
  {
    display_order: 3,
    title: 'Mini Style Icons',
    subtitle: 'Adorable Looks for Your Little Ones',
    cta_text: 'Shop Kids',
    cta_link: '/shop/kids',
    prompt:
      'Cute luxury kids fashion banner, smiling happy African Nigerian girl age 6 wearing adorable soft pink tutu dress and matching hair bow, standing on soft cream fluffy rug in bright sunlit minimalist playroom, holding a small gold handbag, candid joyful expression, ultra high quality editorial child photography, 4k 16:9 widescreen, no text overlay, leave right side empty for copy, warm pastel and cream palette, premium kids clothing brand aesthetic',
  },
  {
    display_order: 4,
    title: 'Statement Accessories',
    subtitle: 'Gold · Bags · Sunglasses · Watches',
    cta_text: 'Discover Accessories',
    cta_link: '/shop/accessories',
    prompt:
      'Luxury accessories flat-lay banner, premium gold jewelry, designer leather handbag, oversized tortoise sunglasses, elegant gold wristwatch, silk scarf in nude cream and brown tones, arranged on warm beige marble surface with soft shadows, warm natural side light, high-end fashion product photography, 4k 16:9 widescreen, no text, leave top right or center space for text overlay, elegant minimal composition, gold cream cocoa palette',
  },
  {
    display_order: 5,
    title: 'End of Season Sale',
    subtitle: 'Up to 50% Off — Limited Stock',
    cta_text: 'Grab Deals',
    cta_link: '/shop/all',
    prompt:
      'Vibrant yet elegant fashion sale banner, two happy beautiful African women high fashion models laughing together, one in bright orange silk dress, one in emerald green jumpsuit, dynamic candid pose against clean warm off-white studio backdrop, soft golden rim lighting, celebration mood, high end editorial campaign photography, 4k 16:9 widescreen, no text in image, leave generous center space for sale headline, pops of color with warm cream background, premium luxury brand aesthetic',
  },
  {
    display_order: 6,
    title: 'The Complete Wardrobe',
    subtitle: 'From Head to Toe — Nadine Kollections',
    cta_text: 'Explore All Categories',
    cta_link: '/shop/all',
    prompt:
      'Premium lifestyle fashion banner collage aesthetic, elegant Black African woman in flowing cream maxi dress walking into boutique with warm wood racks, holding designer leather tote, wearing gold layered necklaces and heeled sandals, background of neatly folded luxury clothes on shelves, warm ambient store lighting, sophisticated store entrance composition, 4k 16:9 widescreen, no text overlay, leave clean upper center space for title, warm cocoa nude cream gold palette, high end fashion retail brand vibe',
  },
];

const BUCKET = 'NadineKollections';
const SIZE = 'landscape_16_9';

(async () => {
  console.log('='.repeat(70));
  console.log('  NADINE KOLLECTIONS — PRODUCTION HERO BANNER PIPELINE');
  console.log('='.repeat(70));
  console.log(`🗄️  Supabase: ${SUPABASE_URL.replace('https://', '').split('.')[0]}`);
  console.log(`🖼️  Generating ${BANNERS.length} banners @ ${SIZE}`);
  console.log(`📦 Storage bucket: ${BUCKET}/banners/`);
  console.log('');

  const createdBanners: any[] = [];

  for (let i = 0; i < BANNERS.length; i++) {
    const b = BANNERS[i];
    const idx = i + 1;
    const tag = `[${idx}/${BANNERS.length}]`;
    console.log(`${tag} 🎨 "${b.title}" — generating image...`);

    try {
      const url = `${IMG_API_PREFIX}?image_size=${SIZE}&prompt=${encodeURIComponent(b.prompt)}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const txt = await resp.text().catch(() => resp.statusText);
        throw new Error(`Image API HTTP ${resp.status}: ${txt.slice(0, 200)}`);
      }
      const buf = await resp.arrayBuffer();
      console.log(`${tag} 📥 downloaded ${(buf.byteLength / 1024).toFixed(1)} KB`);

      const filename = `hero-banner-${String(idx).padStart(2, '0')}-${b.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}.jpg`;
      const storagePath = `banners/${filename}`;

      const { error: upErr } = await sb.storage
        .from(BUCKET)
        .upload(storagePath, Buffer.from(buf), {
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000, immutable',
          upsert: true,
        });
      if (upErr) throw new Error(`Storage upload: ${upErr.message}`);

      const {
        data: { publicUrl },
      } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
      console.log(`${tag} ☁️  uploaded → ${storagePath}`);

      const { data: inserted, error: dbErr } = await sb
        .from('banner_ads')
        .insert({
          title: b.title,
          subtitle: b.subtitle,
          image_url: publicUrl,
          cta_text: b.cta_text,
          cta_link: b.cta_link,
          display_order: b.display_order,
          is_active: true,
        })
        .select()
        .single();

      if (dbErr) throw new Error(`DB insert: ${dbErr.message}`);
      console.log(`${tag} ✅ banner saved (id: ${inserted.id.slice(0, 8)}...) order=${b.display_order}`);
      createdBanners.push({ ...inserted, storagePath });
    } catch (e: any) {
      console.log(`${tag} ❌ FAILED: ${e.message}`);
      console.log(`${tag}    skipping — will continue with remaining banners\n`);
      continue;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`  PIPELINE COMPLETE — ${createdBanners.length} / ${BANNERS.length} banners created`);
  console.log('='.repeat(70));
  console.log('');
  createdBanners.forEach((b, i) => {
    console.log(` ${String(i + 1).padStart(2)}. "${b.title}"`);
    console.log(`     Subtitle : ${b.subtitle}`);
    console.log(`     CTA      : ${b.cta_text} → ${b.cta_link}`);
    console.log(`     Order    : ${b.display_order}`);
    console.log(`     URL      : ${b.image_url}`);
    console.log('');
  });

  const { count: activeCount } = await sb
    .from('banner_ads')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  console.log(`🧮 Active banners in DB now: ${activeCount}`);
  console.log('👉 Visit your homepage — HeroBanner picks these up automatically via getActiveBanners()');
  console.log('👉 Or manage them in Admin → Marketing → Hero Banners panel\n');
})().catch(e => {
  console.error('\n💥 FATAL:', e);
  process.exit(1);
});
