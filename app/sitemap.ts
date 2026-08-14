import { MetadataRoute } from 'next'
import { createStaticClient } from '@/lib/supabase/server'

// All categories we expose URLs for — top-level route buckets and
// ?categories= filter variants (used as dedicated SEO landing pages via
// /shop/all?categories=X — so search engines can deep-crawl the inventory).
//
// Values are the exact tag strings stored in products.category TEXT[]
// (PostgreSQL uses case-sensitive contains match).

const TOP_LEVEL_ROUTES: Array<{
  slug: string;          // /shop/<slug>
  priority: number;
  label?: string;        // sitemap comment context only
}> = [
  { slug: 'all',         priority: 0.9,  label: 'All products catalog' },
  { slug: 'women',       priority: 0.9,  label: 'Women top-level (Corporate + Leisure)' },
  { slug: 'men',         priority: 0.85, label: 'Men top-level (Jeans, Caps, Shoes, Clothes)' },
  { slug: 'kids',        priority: 0.8,  label: 'Kids top-level (M&S clothes, shoes, bags)' },
  { slug: 'accessories', priority: 0.8,  label: 'Accessories top-level' },
  { slug: 'gadgets',     priority: 0.75, label: 'Gadgets top-level (dashcams, phone holders, ring lights)' },
  { slug: 'beauty',      priority: 0.7,  label: 'Beauty top-level (Makeup, Brushes, Boxes)' },
];

// Deep category landing pages — build as /shop/all?categories=<TAG>
// These are the product-type tags used in the footer and homepage tiles.
const DEEP_CATEGORY_TAGS: Array<{
  tag: string;
  priority: number;
  changeFreq: MetadataRoute.Sitemap[0]['changeFrequency'];
}> = [
  // Major revenue drivers (user confirmed)
  { tag: 'Shoes',        priority: 0.85, changeFreq: 'daily' },
  { tag: 'Wigs',         priority: 0.85, changeFreq: 'daily' },
  { tag: 'Bags',         priority: 0.8,  changeFreq: 'daily' },
  { tag: 'Pantyhose',    priority: 0.9,  changeFreq: 'daily' }, // best seller
  { tag: 'Hosiery',      priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Scarves',      priority: 0.7,  changeFreq: 'weekly' },

  // Watches + jewelry
  { tag: 'Watches',      priority: 0.75, changeFreq: 'weekly' },
  { tag: 'Bangles',      priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Jewelry',      priority: 0.75, changeFreq: 'weekly' },
  { tag: 'Earrings',     priority: 0.7,  changeFreq: 'weekly' },

  // Shoe subtypes
  { tag: 'Pumps',        priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Heels',        priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Flats',        priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Loafers',      priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Palms',        priority: 0.65, changeFreq: 'weekly' },
  { tag: 'Sneakers',     priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Sandals',      priority: 0.65, changeFreq: 'weekly' },
  { tag: 'Boots',        priority: 0.65, changeFreq: 'weekly' },
  { tag: 'Slippers',     priority: 0.6,  changeFreq: 'monthly' },

  // Teens and sub-audiences
  { tag: 'Teens',        priority: 0.75, changeFreq: 'daily' },
  { tag: 'Girls',        priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Boys',         priority: 0.7,  changeFreq: 'weekly' },

  // Style/occasion
  { tag: 'Corporate Wear',  priority: 0.75, changeFreq: 'weekly' },
  { tag: 'Leisure Wear',    priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Casual Wear',     priority: 0.65, changeFreq: 'weekly' },
  { tag: 'Formal Wear',     priority: 0.6,  changeFreq: 'monthly' },
  { tag: 'School Wear',     priority: 0.6,  changeFreq: 'monthly' },

  // Men's sub categories
  { tag: 'Jeans',        priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Caps',         priority: 0.65, changeFreq: 'weekly' },
  { tag: 'Shirts',       priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Suits',        priority: 0.65, changeFreq: 'monthly' },

  // Niche + premium
  { tag: 'Aviation',     priority: 0.65, changeFreq: 'monthly' },
  { tag: 'Aviation Pins',priority: 0.6,  changeFreq: 'monthly' },

  // Beauty / gadgets sub
  { tag: 'Makeup',              priority: 0.7,  changeFreq: 'weekly' },
  { tag: 'Makeup Brushes',      priority: 0.65, changeFreq: 'weekly' },
  { tag: 'Makeup Boxes',        priority: 0.65, changeFreq: 'weekly' },
  { tag: 'Ring Lights',         priority: 0.65, changeFreq: 'weekly' },
  { tag: 'Phone Holders',       priority: 0.6,  changeFreq: 'monthly' },
  { tag: 'Cameras',             priority: 0.6,  changeFreq: 'monthly' },
  { tag: 'Dashcams',            priority: 0.6,  changeFreq: 'monthly' },
];

const STATIC_INFO_ROUTES: MetadataRoute.Sitemap = [
  { url: '/contact',         changeFrequency: 'monthly', priority: 0.5 },
  { url: '/faqs',            changeFrequency: 'monthly', priority: 0.5 },
  { url: '/shipping-policy', changeFrequency: 'monthly', priority: 0.4 },
  { url: '/returns',         changeFrequency: 'monthly', priority: 0.4 },
  { url: '/track-order',     changeFrequency: 'weekly',  priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nadinekollections.com'
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [];

  // 1. Homepage
  routes.push({
    url: baseUrl,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1,
  });

  // 2. Top-level /shop/<slug> routes
  for (const r of TOP_LEVEL_ROUTES) {
    routes.push({
      url: `${baseUrl}/shop/${r.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: r.priority,
    });
  }

  // 3. Deep category pages (/shop/all?categories=TAG)
  for (const c of DEEP_CATEGORY_TAGS) {
    const encoded = encodeURIComponent(c.tag);
    routes.push({
      url: `${baseUrl}/shop/all?categories=${encoded}`,
      lastModified: now,
      changeFrequency: c.changeFreq,
      priority: c.priority,
    });
  }

  // 4. Popular two-tag combinations (Shoes + Women, Wigs + Women, etc.)
  const COMBO_TAGS: Array<{ tags: string[]; priority: number; changeFreq: MetadataRoute.Sitemap[0]['changeFrequency'] }> = [
    { tags: ['Women', 'Shoes'],            priority: 0.85, changeFreq: 'daily' },
    { tags: ['Women', 'Wigs'],             priority: 0.85, changeFreq: 'daily' },
    { tags: ['Women', 'Bags'],             priority: 0.8,  changeFreq: 'daily' },
    { tags: ['Women', 'Pumps'],            priority: 0.75, changeFreq: 'weekly' },
    { tags: ['Women', 'Heels'],            priority: 0.75, changeFreq: 'weekly' },
    { tags: ['Women', 'Corporate Wear'],   priority: 0.8,  changeFreq: 'weekly' },
    { tags: ['Women', 'Leisure Wear'],     priority: 0.75, changeFreq: 'weekly' },
    { tags: ['Women', 'Pantyhose'],        priority: 0.85, changeFreq: 'daily' },
    { tags: ['Men', 'Shoes'],              priority: 0.75, changeFreq: 'daily' },
    { tags: ['Men', 'Jeans'],              priority: 0.7,  changeFreq: 'weekly' },
    { tags: ['Men', 'Caps'],               priority: 0.65, changeFreq: 'weekly' },
    { tags: ['Men', 'Suits'],              priority: 0.65, changeFreq: 'monthly' },
    { tags: ['Kids', 'Shoes'],             priority: 0.7,  changeFreq: 'weekly' },
    { tags: ['Kids', 'Clothing'],          priority: 0.7,  changeFreq: 'weekly' },
    { tags: ['Kids', 'School Wear'],       priority: 0.65, changeFreq: 'monthly' },
    { tags: ['Teens', 'Shoes'],            priority: 0.65, changeFreq: 'weekly' },
    { tags: ['Teens', 'Clothing'],         priority: 0.65, changeFreq: 'weekly' },
    { tags: ['Accessories', 'Watches'],    priority: 0.7,  changeFreq: 'weekly' },
    { tags: ['Accessories', 'Jewelry'],    priority: 0.7,  changeFreq: 'weekly' },
    { tags: ['Shoes', 'Sneakers'],         priority: 0.7,  changeFreq: 'weekly' },
  ];
  for (const c of COMBO_TAGS) {
    const encoded = encodeURIComponent(c.tags.join(','));
    routes.push({
      url: `${baseUrl}/shop/all?categories=${encoded}`,
      lastModified: now,
      changeFrequency: c.changeFreq,
      priority: c.priority,
    });
  }

  // 5. Static info routes
  for (const r of STATIC_INFO_ROUTES) {
    routes.push({
      url: `${baseUrl}${r.url}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    });
  }

  // 6. Brand pages + all active product pages (DB-backed)
  try {
    const supabase = createStaticClient();

    // Brand pages
    try {
      const { data: brands } = await supabase
        .from('brands')
        .select('id, slug, updated_at')
        .eq('is_active', true);

      if (brands && brands.length > 0) {
        for (const b of brands) {
          // URL form: /shop/all?brands=<UUID> — slug-only requires a lookup
          // route which doesn't exist yet, so use the filterable URL.
          const encoded = encodeURIComponent(String(b.id));
          routes.push({
            url: `${baseUrl}/shop/all?brands=${encoded}`,
            lastModified: b.updated_at ? new Date(b.updated_at) : now,
            changeFrequency: 'weekly',
            priority: 0.65,
          });
        }
      }
    } catch (err) {
      // brands table may not exist yet — skip silently
    }

    // Product detail pages
    const { data: products } = await supabase
      .from('products')
      .select('slug, category, updated_at')
      .eq('is_active', true);

    if (products && products.length > 0) {
      for (const product of products) {
        const catBucket =
          Array.isArray(product.category) && product.category[0]
            ? product.category[0].toLowerCase()
            : 'all';
        routes.push({
          url: `${baseUrl}/shop/${catBucket}/${product.slug}`,
          lastModified: product.updated_at
            ? new Date(product.updated_at)
            : now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch (error) {
    console.error('Error generating sitemap (DB section):', error);
  }

  return routes;
}
