import { HeroBanner } from "@/components/customer/HeroBanner";
import { ProductCard } from "@/components/customer/ProductCard";
import { RecentlyViewedSection } from "@/components/customer/RecentlyViewedSection";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elegant%20nude%20corporate%20pump%20heels%20shoes%20comfortable%20attractive%20luxury%20fashion%20product%20photography%20soft%20lighting&image_size=landscape_4_3",
      link: "/shop/women",
    },
    {
      name: "Men",
      image:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=handsome%20mature%20african%20man%20well%20dressed%20clean%20smart%20casual%20fashion%20professional%20portrait%20studio%20lighting&image_size=landscape_4_3",
      link: "/shop/men",
    },
    {
      name: "Shoes",
      image:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=luxury%20collection%20of%20mens%20womens%20shoes%20heels%20pumps%20loafers%20sneakers%20flats%20premium%20fashion%20display&image_size=landscape_4_3",
      link: "/shop/all?categories=Shoes",
    },
    {
      name: "Wigs",
      image:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beautiful%20african%20woman%20with%20long%20luxurious%20hair%20wig%20all%20colors%20straight%20curly%20waves%20fashion%20beauty&image_size=landscape_4_3",
      link: "/shop/all?categories=Wigs",
    },
    {
      name: "Bags",
      image:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elegant%20luxury%20handbags%20purses%20leather%20bags%20collection%20premium%20fashion%20accessories%20display&image_size=landscape_4_3",
      link: "/shop/all?categories=Bags",
    },
    {
      name: "Kids",
      image:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20happy%20african%20kids%20children%20colorful%20fashion%20clothes%20shoes%20bags%20smiling%20studio&image_size=landscape_4_3",
      link: "/shop/kids",
    },
    {
      name: "Teens",
      image:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=stylish%20african%20teenagers%20teens%20fashion%20casual%20wear%20trendy%20outfits%20youth%20style&image_size=landscape_4_3",
      link: "/shop/all?categories=Teens",
    },
    {
      name: "Gadgets",
      image:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=tech%20gadgets%20phone%20holders%20cameras%20dashcams%20ring%20lights%20makeup%20boxes%20modern%20products%20flat%20lay&image_size=landscape_4_3",
      link: "/shop/gadgets",
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
                  category={Array.isArray(product.category) ? product.category[0] : product.category}
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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

        <RecentlyViewedSection
          fallback={
            <section className="py-12 md:py-20 container mx-auto px-4 md:px-6 text-center">
              <div className="max-w-2xl mx-auto bg-primary/5 rounded-3xl p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-4">Join the Family</h2>
                <p className="text-text-secondary mb-8">
                  Subscribe to our newsletter and get 10% off your first order plus exclusive access to new arrivals.
                </p>
                <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 rounded-lg border border-border-light px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button className="w-full sm:w-auto">Subscribe</Button>
                </form>
              </div>
            </section>
          }
        />
      </main>
    </div>
  );
}
