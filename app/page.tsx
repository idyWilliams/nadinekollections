import { HeroBanner } from "@/components/customer/HeroBanner";
import { ProductCard } from "@/components/customer/ProductCard";
import { RecentlyViewedSection } from "@/components/customer/RecentlyViewedSection";
import { OptimizedImage } from "@/components/ui/optimized-image";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts } from "@/lib/services/products";
import { getActiveBanners } from "@/lib/services/banners";

export const revalidate = 60;

export default async function Home() {
  const [featuredProducts, banners] = await Promise.all([
    getFeaturedProducts(8),
    getActiveBanners(),
  ]);

  const categories = [
    {
      name: "Women",
      image:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=75",
      link: "/shop/women",
    },
    {
      name: "Men",
      image:
        "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=75",
      link: "/shop/men",
    },
    {
      name: "Kids & Teens",
      image:
        "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=1200&q=75",
      link: "/shop/kids",
    },
    {
      name: "Accessories",
      image:
        "https://images.unsplash.com/photo-1611923134239-b9be5816c4b3?auto=format&fit=crop&w=1200&q=75",
      link: "/shop/accessories",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner initialBanners={banners} />

      <main className="container mx-auto px-4 md:px-6 py-12 space-y-12 md:space-y-24">
        <section className="py-12 md:py-20 px-4 md:px-6 container mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-4">Trending Now</h2>
              <p className="text-text-secondary max-w-xl">
                Discover our most popular items, curated just for you. From elegant dresses to smart gadgets.
              </p>
            </div>
            <Link href="/shop/all">
              <Button variant="ghost" className="gap-2 pl-0 md:pl-4">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  slug={product.slug}
                  price={product.price}
                  salePrice={product.sale_price ?? undefined}
                  image={product.primary_image || (product.images && product.images[0]) || "/placeholder.jpg"}
                  category={product.category}
                  brand_name={product.brand?.name ?? null}
                  isNew={product.is_new}
                  stock={product.stock}
                  isActive={product.is_active}
                  variants={product.variants}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-surface p-8 text-center">
              <p className="text-lg font-medium text-text-primary">
                No featured products available yet.
              </p>
              <p className="text-text-secondary">
                Check back soon for our latest collections!
              </p>
            </div>
          )}
        </section>

        <section className="py-12 md:py-20 bg-surface">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold mb-8 md:mb-12 text-center">Shop by Category</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.link}
                  className="group relative block h-[200px] sm:h-[260px] md:h-[300px] lg:h-[340px] overflow-hidden rounded-2xl"
                >
                  <OptimizedImage
                    src={cat.image}
                    alt={`${cat.name} category`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{cat.name}</h3>
                    <span className="text-white/80 text-sm font-medium flex items-center gap-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      Shop Now <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <RecentlyViewedSection />
      </main>
    </div>
  );
}
