import { createPublicClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/customer/ProductCard";

import { Pagination } from "@/components/shared/Pagination";
import { ProductFilters } from "@/components/customer/ProductFilters";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function parseCsvParam(
  raw: string | string[] | undefined
): string[] {
  if (!raw) return [];
  const str = Array.isArray(raw) ? raw[0] : raw;
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category } = await params;
  const sp = await searchParams;
  const pageParam = sp.page;
  const qParam = sp.q;
  const categoriesParam = sp.categories;
  const brandsParam = sp.brands;
  const minPriceParam = sp.minPrice;
  const maxPriceParam = sp.maxPrice;
  const sortParam = sp.sort;
  const typeParam = sp.type; // legacy fallback

  const categoryName = capitalize(category);
  const searchQuery = typeof qParam === "string" ? qParam : "";

  const refinedCategories = parseCsvParam(categoriesParam);
  const refinedBrands = parseCsvParam(brandsParam);
  const minPrice =
    typeof minPriceParam === "string" && minPriceParam !== ""
      ? Number(minPriceParam)
      : null;
  const maxPrice =
    typeof maxPriceParam === "string" && maxPriceParam !== ""
      ? Number(maxPriceParam)
      : null;
  const sort = typeof sortParam === "string" ? sortParam : "newest";

  const currentPage =
    typeof pageParam === "string" ? Number(pageParam) || 1 : 1;
  const itemsPerPage = 12;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  let products = [];
  let count = 0;
  let error = null;

  try {
    const supabase = createPublicClient();

    let query = supabase
      .from("products")
      .select("*, brand:brands(id, name, slug), variants:product_variants(*)", { count: "exact" })
      .eq("is_active", true);

    // 1. Top-level route filter (e.g. /shop/women -> Women)
    if (category.toLowerCase() !== "all") {
      query = query.contains("category", [categoryName]);
    }

    // 2. Legacy type=shoes support (footer/bookmark backward compat)
    if (typeParam === "shoes") {
      query = query.contains("category", ["Shoes"]);
    }

    // 3. Multi-category refinement (AND: product must have EVERY tag)
    if (refinedCategories.length > 0) {
      query = query.contains("category", refinedCategories);
    }

    // 4. Brand filter
    if (refinedBrands.length > 0) {
      query = query.in("brand_id", refinedBrands);
    }

    // 5. Price range
    if (minPrice !== null && !isNaN(minPrice)) {
      query = query.gte("sale_price", minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      query = query.lte("sale_price", maxPrice);
    }

    // 6. Keyword search
    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    // 7. Sort (before range, since range wraps order)
    switch (sort) {
      case "price-asc":
        query = query.order("sale_price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("sale_price", { ascending: false });
        break;
      case "name-asc":
        query = query.order("title", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Stable secondary order so results stay deterministic across pages
    query = query.order("id", { ascending: true }).range(from, to);

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
                      category={product.category}
                      brand_name={product.brand?.name ?? null}
                      isNew={product.is_new}
                      stock={product.stock}
                      isActive={product.is_active}
                      variants={product.variants}
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
