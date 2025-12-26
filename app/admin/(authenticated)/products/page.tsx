
import { createClient } from "@/lib/supabase/server";
import { ProductInventoryGrid } from "@/components/admin/ProductInventoryGrid";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const formattedProducts = products?.map(product => ({
    id: product.id,
    title: product.title,
    category: Array.isArray(product.category) ? product.category[0] : product.category, // Handle array or string
    price: product.price,
    stock: product.stock,
    image: product.primary_image || product.images?.[0] || '/placeholder.png',
    status: product.is_active ? 'Active' : 'Inactive',
    is_active: product.is_active,
    is_featured: product.is_featured || false,
    created_at: product.created_at,
    stockStatus: (product.stock === 0 ? 'out' : product.stock < 10 ? 'low' : 'in') as 'out' | 'low' | 'in',
  })) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-text-secondary">Manage your product inventory.</p>
        </div>
      </div>

      <ProductInventoryGrid products={formattedProducts} />
    </div>
  );
}
