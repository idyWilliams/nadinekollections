import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/customer/ProductCard";

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

  // Calculate pagination
  const totalPages = Math.ceil(count / itemsPerPage);


  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Mobile Header with Search */}
        <div className="md:hidden mb-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{searchQuery ? `Search: "${searchQuery}"` : categoryName}</h1>
            <p className="text-sm text-text-secondary">{count} products found</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Sidebar / Filters */}
          <ProductFilters
            categoryName={categoryName}
            totalItems={count}
            activeCategory={category}
            activeType={type as string}
          />

          {/* Product Grid */}
          <div className="flex-1 w-full">
            {products && products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      slug={product.slug}
                      price={product.price}
                      salePrice={product.sale_price ?? undefined}
                      image={product.primary_image || (product.images && product.images[0]) || "/placeholder.jpg"}
                      category={categoryName}
                      isNew={product.is_new}
                      stock={product.stock}
                      isActive={product.is_active}
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
