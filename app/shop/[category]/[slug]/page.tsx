import { createClient } from "@/lib/supabase/server";
import { ProductDetails } from "@/components/customer/ProductDetails";
import { ProductCard } from "@/components/customer/ProductCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !product) {
    console.error("Product not found:", error);
    // Fallback for demo if DB is empty
    // return notFound();
  }

  // Mock product if not found in DB (for demo purposes)
  const displayProduct = product || {
    id: "mock-1",
    title: "Demo Product",
    description: "This is a demo product description. It features high-quality materials and a premium design.",
    price: 15000,
    primary_image: "/products/women-1.png",
    category: "Women",
    stock: 10,
    images: ["/products/women-1.png", "/products/women-1.png"],
    features: ["Premium Quality", "Sustainable Materials", "Handmade"],
    variants: [],
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-6 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link href={`/shop/${category.toLowerCase()}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to {category}
          </Link>
        </div>

        <ProductDetails product={displayProduct} />

        {/* Featured Products / You May Also Like */}
        <section className="mt-24">
          <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Mock Featured Products - In a real app, fetch related products */}
            <ProductCard
              id="feat-1"
              title="Classic Silk Blouse"
              slug="classic-silk-blouse"
              price={45000}
              image="/products/women-2.png"
              category="Women"
              isNew
            />
            <ProductCard
              id="feat-2"
              title="Tailored Linen Trousers"
              slug="tailored-linen-trousers"
              price={35000}
              image="/products/women-3.png"
              category="Women"
            />
            <ProductCard
              id="feat-3"
              title="Gold Plated Necklace"
              slug="gold-plated-necklace"
              price={15000}
              image="/products/accessories-1.png"
              category="Accessories"
            />
            <ProductCard
              id="feat-4"
              title="Leather Crossbody Bag"
              slug="leather-crossbody-bag"
              price={55000}
              image="/products/accessories-2.png"
              category="Accessories"
              isSale
              salePrice={45000}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
