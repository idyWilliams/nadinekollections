import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/customer/ProductCard";
import { notFound } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

// Helper to capitalize category for display/query
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categoryName = capitalize(category);

  let products = [];
  let error = null;

  try {
    const supabase = await createClient();

    // Fetch products for this category
    // We use 'contains' for array columns in Supabase
    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (category.toLowerCase() !== "all") {
      query = query.contains("category", [categoryName]);
    }

    const result = await query;

    products = result.data || [];
    error = result.error;
  } catch (e) {
    console.error("Supabase connection error:", e);
    // Fallback to empty array if connection fails
    products = [];
  }

  if (error) {
    console.error("Error fetching products:", error);
    // In a real app, handle error gracefully
  }

  // Fallback for demo if no DB connection or empty
  // This ensures the UI is visible even if the user hasn't set up Supabase yet
  const mockProducts = [
    {
      id: "mock-1",
      title: "Luxury Silk Dress",
      description: "Elegant silk dress for special occasions.",
      price: 45000,
      primary_image: "/products/women-1.png",
      category: "Women",
      slug: "luxury-silk-dress",
      stock: 10,
    },
    {
      id: "mock-2",
      title: "Classic Leather Loafers",
      description: "Handcrafted leather loafers.",
      price: 25000,
      primary_image: "/products/men-1.png",
      category: "Men",
      slug: "classic-leather-loafers",
      stock: 15,
    },
    {
      id: "mock-3",
      title: "Kids Denim Jacket",
      description: "Durable and stylish denim jacket.",
      price: 12000,
      primary_image: "/products/kids-1.png",
      category: "Kids",
      slug: "kids-denim-jacket",
      stock: 20,
    },
    {
      id: "mock-4",
      title: "Gold Plated Necklace",
      description: "18k gold plated necklace.",
      price: 8500,
      primary_image: "/products/accessories-1.png",
      category: "Accessories",
      slug: "gold-plated-necklace",
      stock: 50,
    },
    {
      id: "mock-5",
      title: "Smart Noise Cancelling Headphones",
      description: "Premium sound quality.",
      price: 35000,
      primary_image: "/products/gadget-1.png",
      category: "Gadgets",
      slug: "smart-headphones",
      stock: 30,
    },
  ];

  const displayProducts = products?.length
    ? products
    : mockProducts.filter(p => category.toLowerCase() === 'all' || p.category.toLowerCase() === category.toLowerCase());

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Filters */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
              <p className="text-text-secondary">
                {displayProducts?.length || 0} products found
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Sort By</h3>
              <select className="w-full rounded-md border border-border-light bg-surface p-2 text-sm">
                <option>Newest Arrivals</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full rounded-md border border-border-light bg-surface p-2 text-sm"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full rounded-md border border-border-light bg-surface p-2 text-sm"
                />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {displayProducts && displayProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    slug={product.slug}
                    price={product.price}
                    salePrice={product.sale_price}
                    image={product.primary_image}
                    category={categoryName} // Pass the current category context
                    isNew={false} // Could derive from created_at
                    stock={10} // Need to fetch inventory if we want real stock
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-surface p-8 text-center">
                <p className="text-lg font-medium text-text-primary">
                  No products found in this category.
                </p>
                <p className="text-text-secondary">
                  Try checking back later or browse other categories.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
