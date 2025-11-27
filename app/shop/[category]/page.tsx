import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/customer/ProductCard";
import { notFound } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { Pagination } from "@/components/shared/Pagination";

// Helper to capitalize category for display/query
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

import { ProductFilters } from "@/components/customer/ProductFilters";

// ... (imports remain the same, ensure ProductFilters is imported)

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category } = await params;
  const { type, page, q } = await searchParams;
  const categoryName = capitalize(category);
  const isShoesFilter = type === 'shoes';
  const searchQuery = typeof q === 'string' ? q : '';

  // ... (data fetching logic remains the same)
  // Pagination Config
  const currentPage = Number(page) || 1;
  const itemsPerPage = 12;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  let products = [];
  let count = 0;
  let error = null;

  try {
    const supabase = await createClient();

    // Fetch products for this category
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .range(from, to);

    if (category.toLowerCase() !== "all") {
      query = query.contains("category", [categoryName]);
    }

    if (isShoesFilter) {
      query = query.contains("category", ["Shoes"]);
    }

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const result = await query;

    products = result.data || [];
    count = result.count || 0;
    error = result.error;
  } catch (e) {
    console.error("Supabase connection error:", e);
    products = [];
  }

  if (error) {
    console.error("Error fetching products:", error);
  }

  // Fallback for demo if no DB connection or empty
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

  // If using mock data, handle pagination manually
  let displayProducts = products;
  let totalItems = count;

  if (!products?.length && !error) {
     let filteredMocks = mockProducts.filter(p => category.toLowerCase() === 'all' || p.category.toLowerCase() === category.toLowerCase());
     if (isShoesFilter) {
        filteredMocks = filteredMocks.filter(p => p.title.toLowerCase().includes('shoe') || p.title.toLowerCase().includes('loafer') || p.title.toLowerCase().includes('sneaker') || p.title.toLowerCase().includes('boot'));
     }

      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        filteredMocks = filteredMocks.filter(p =>
          p.title.toLowerCase().includes(lowerQ) ||
          p.description.toLowerCase().includes(lowerQ)
        );
      }
     totalItems = filteredMocks.length;
     displayProducts = filteredMocks.slice(from, to + 1);
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar / Filters */}
          <ProductFilters
            categoryName={categoryName}
            totalItems={totalItems}
            activeCategory={category}
            activeType={type as string}
          />

          {/* Product Grid */}
          <div className="flex-1 w-full">
            {displayProducts && displayProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {displayProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      slug={product.slug}
                      price={product.price}
                      salePrice={product.sale_price}
                      image={product.primary_image || (product.images && product.images[0]) || "/placeholder.jpg"}
                      category={categoryName}
                      isNew={product.is_new}
                      stock={product.stock}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8">
                  <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      baseUrl={`/shop/${category}`}
                  />
                </div>
              </>
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
