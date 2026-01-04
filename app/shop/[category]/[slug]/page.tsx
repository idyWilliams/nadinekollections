
import { ProductDetails } from "@/components/customer/ProductDetails";
import { ProductCard } from "@/components/customer/ProductCard";
import { RecentlyViewedTracker } from "@/components/customer/RecentlyViewedTracker";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/products";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  // Fetch product from Supabase
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products from same category
  const relatedProducts = await getRelatedProducts(product.id, product.category, 4);

  return (
    <div className="min-h-screen bg-background">
      <RecentlyViewedTracker
        product={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          salePrice: product.sale_price ?? undefined,
          image: product.primary_image || (product.images && product.images[0]) || "/placeholder.jpg",
          category: Array.isArray(product.category) ? product.category[0] : product.category,
        }}
      />
      <main className="container mx-auto px-4 md:px-6 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link href={`/shop/${category.toLowerCase()}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to {category}
          </Link>
        </div>

        <ProductDetails product={{
          ...product,
          description: product.description || "",
          primary_image: product.primary_image || "/placeholder.png",
          sale_price: product.sale_price === null ? undefined : product.sale_price,
          category: product.category[0] || "Uncategorized"
        }} />

        {/* Related Products / You May Also Like */}
        {relatedProducts.length > 0 && (
          <section className="mt-24">
            <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  title={relatedProduct.title}
                  slug={relatedProduct.slug}
                  price={relatedProduct.price}
                  salePrice={relatedProduct.sale_price ?? undefined}
                  image={relatedProduct.primary_image || (relatedProduct.images && relatedProduct.images[0]) || "/placeholder.jpg"}
                  category={Array.isArray(relatedProduct.category) ? relatedProduct.category[0] : relatedProduct.category}
                  isNew={relatedProduct.is_new}
                  stock={relatedProduct.stock}
                  isActive={relatedProduct.is_active}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
