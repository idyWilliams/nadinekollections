"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash } from "lucide-react";
import Link from "next/link";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      // Mock data
      setProducts([
        { id: "1", title: "Kids Floral Dress", category: "Kids", price: 9500, stock: 15, image: "/products/kids-1.png", status: "Active" },
        { id: "2", title: "Women Flashy Sequined Gown", category: "Women", price: 42000, stock: 8, image: "/products/women-1.png", status: "Active" },
        { id: "3", title: "Men Casual Full Wear Set", category: "Men", price: 18000, stock: 20, image: "/products/men-1.png", status: "Active" },
        { id: "4", title: "Magnetic Phone Holder", category: "Accessories", price: 2500, stock: 40, image: "/products/accessories-1.png", status: "Active" },
      ]);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-text-secondary">Manage your product inventory.</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="btn-primary">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      <div className="bg-surface rounded-xl shadow-card border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-text-secondary font-medium border-b border-border-light">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden">
                        <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                      </div>
                      <span className="font-medium">{product.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">
                    <Badge variant="success">{product.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-error hover:text-error hover:bg-error/10">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
