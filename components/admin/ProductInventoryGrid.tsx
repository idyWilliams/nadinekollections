
"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  MoreHorizontal,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Trash,
  Edit,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  status: string;
  is_active: boolean;
}

interface ProductInventoryGridProps {
  products: Product[];
}

export function ProductInventoryGrid({ products: initialProducts }: ProductInventoryGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // React Query for Products
  const { data: products = initialProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map(product => ({
        id: product.id,
        title: product.title,
        category: Array.isArray(product.category) ? product.category[0] : product.category,
        price: product.price,
        stock: product.stock,
        image: product.primary_image || product.images?.[0] || '/placeholder.png',
        status: product.is_active ? 'Active' : 'Inactive',
        is_active: product.is_active
      }));
    },
    initialData: initialProducts,
    staleTime: 1000 * 60, // 1 minute
  });

  const toggleProductStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Product ${!currentStatus ? "visible" : "hidden"} successfully`);
      // Invalidate query to refresh data seamlessly
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Product deleted successfully");
      // Invalidate query to refresh data seamlessly
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center border border-border-light rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-none h-9 w-9 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-none h-9 w-9 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Link href="/admin/products/new">
            <Button className="btn-primary h-9">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary ml-2">
            {selectedProducts.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-error hover:text-error border-error/20 hover:bg-error/10">
              <Trash className="mr-2 h-4 w-4" /> Delete
            </Button>
            <Button variant="outline" size="sm">
              Set Inactive
            </Button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group relative bg-surface rounded-xl border border-border-light shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="absolute top-3 left-3 z-10">
                <button onClick={() => toggleSelect(product.id)} className="text-white drop-shadow-md">
                  {selectedProducts.includes(product.id) ? <CheckSquare className="h-5 w-5 text-primary fill-surface" /> : <Square className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative aspect-square bg-muted overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium truncate pr-2" title={product.title}>{product.title}</h3>
                    <p className="text-xs text-text-secondary">{product.category}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Product
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleProductStatus(product.id, product.is_active)}>
                        {product.is_active ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" /> Hide Product
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" /> Show Product
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-error" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold">{formatCurrency(product.price)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${product.stock < 5 ? 'bg-error/10 text-error' : 'bg-muted text-text-secondary'}`}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border-light bg-surface overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-text-secondary font-medium border-b border-border-light">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <button onClick={toggleSelectAll}>
                      {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-muted/50 transition-colors ${selectedProducts.includes(product.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(product.id)}>
                        {selectedProducts.includes(product.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-text-muted" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-md bg-muted overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <span className="font-medium">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`${product.stock < 5 ? 'text-error font-bold' : ''}`}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.status === 'Active' ? 'success' : 'secondary'}>{product.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-error hover:text-error hover:bg-error/10">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className={`bg-surface rounded-lg border border-border-light p-4 shadow-sm ${selectedProducts.includes(product.id) ? 'ring-2 ring-primary/20' : ''}`}>
                <div className="flex gap-4 mb-3">
                  <div className="relative h-16 w-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                    <button
                      onClick={() => toggleSelect(product.id)}
                      className="absolute top-1 left-1 bg-black/20 rounded p-0.5"
                    >
                      {selectedProducts.includes(product.id) ? <CheckSquare className="h-4 w-4 text-primary fill-white" /> : <Square className="h-4 w-4 text-white" />}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate pr-2">{product.title}</h3>
                      <Badge variant={product.status === 'Active' ? 'success' : 'secondary'} className="text-[10px] h-5">{product.status}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary">{product.category}</p>
                    <p className="font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-light">
                  <div className="text-sm">
                    Stock: <span className={`${product.stock < 5 ? 'text-error font-bold' : ''}`}>{product.stock}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8" onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-error">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
