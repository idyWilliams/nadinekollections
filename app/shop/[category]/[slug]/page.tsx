import { createClient } from "@/lib/supabase/server";
import { ProductDetails } from "@/components/customer/ProductDetails";
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
        <ProductDetails product={displayProduct} />
      </main>
    </div>
  );
}
