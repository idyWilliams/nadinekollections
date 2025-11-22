import { HeroBanner } from "@/components/customer/HeroBanner";
import { ProductCard } from "@/components/customer/ProductCard";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Mock data - replace with DB fetch later
const featuredProducts = [
  {
    id: "1",
    title: "Kids Floral Dress",
    slug: "kids-floral-dress",
    price: 9500,
    image: "/products/kids-1.png",
    category: "Kids",
    isNew: true,
    stock: 5,
  },
  {
    id: "2",
    title: "Women Flashy Sequined Gown",
    slug: "sequined-gown",
    price: 42000,
    salePrice: 35000,
    image: "/products/women-1.png",
    category: "Women",
    isSale: true,
  },
  {
    id: "3",
    title: "Men Casual Full Wear Set",
    slug: "men-casual-set",
    price: 18000,
    image: "/products/men-1.png",
    category: "Men",
  },
  {
    id: "4",
    title: "Smart LED Mood Light",
    slug: "smart-led-light",
    price: 7800,
    image: "/products/accessories-1.png",
    category: "Gadgets",
    isNew: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />

      <main className="container mx-auto px-4 md:px-6 py-12 space-y-12 md:space-y-24">
        {/* Featured Collection */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-12 md:py-20 bg-surface">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold mb-8 md:mb-12 text-center">Shop by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Kids", image: "/kidsCategory.jpeg", link: "/shop/kids" },
                { name: "Women", image: "/banners/womenCategory.png", link: "/shop/women" },
                { name: "Men", image: "/banners/menCategory.png", link: "/shop/men" },
                { name: "Accessories", image: "/banners/cat_accessories.png", link: "/shop/accessories" },
              ].map((cat) => (
                <Link key={cat.name} href={cat.link} className="group relative h-[300px] md:h-[400px] overflow-hidden rounded-2xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${cat.image})` }}
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

        {/* Newsletter Section */}
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
      </main>
    </div>
  );
}
