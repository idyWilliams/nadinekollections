import { MetadataRoute } from 'next'
import { createStaticClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nadinekollections.com'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop/all`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/women`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/men`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/kids`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/accessories`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/gadgets`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // Fetch all active products from Supabase
  try {
    const supabase = createStaticClient()
    const { data: products } = await supabase
      .from('products')
      .select('slug, category, updated_at')
      .eq('is_active', true)

    const productRoutes: MetadataRoute.Sitemap = products?.map((product) => ({
      url: `${baseUrl}/shop/${Array.isArray(product.category) ? product.category[0].toLowerCase() : 'all'}/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    })) || []

    return [...staticRoutes, ...productRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticRoutes
  }
}
