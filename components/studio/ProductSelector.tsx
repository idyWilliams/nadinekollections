"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  price: number;
  primary_image: string;
  category: string[];
}

interface Props {
  selected: Product[];
  onSelect: (product: Product) => void;
}

export function ProductSelector({ selected, onSelect }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, title, price, primary_image, category')
          .eq('is_active', true)
          .limit(20); // Limit for demo

        if (error) throw error;

        if (data && data.length > 0) {
          setProducts(data);
        } else {
          throw new Error("No products found");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        // Fallback mock data if DB is empty or error occurs
        setProducts([
          { id: 'm1', title: 'Silk Evening Gown', price: 125000, primary_image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop', category: ['Women'] },
          { id: 'm2', title: 'Tailored Blazer', price: 85000, primary_image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop', category: ['Women'] },
          { id: 'm3', title: 'Pleated Midi Skirt', price: 45000, primary_image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=800&auto=format&fit=crop', category: ['Women'] },
          { id: 'm4', title: 'Cashmere Sweater', price: 65000, primary_image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop', category: ['Women'] },
          { id: 'm5', title: 'Designer Handbag', price: 150000, primary_image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop', category: ['Accessories'] },
          { id: 'm6', title: 'Gold Statement Earrings', price: 35000, primary_image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop', category: ['Accessories'] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [supabase]);

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Search products..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          Loading wardrobe...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pb-4">
          {filteredProducts.map((product) => {
            const isSelected = selected.some(s => s.id === product.id);
            return (
              <div
                key={product.id}
                onClick={() => onSelect(product)}
                className={`group relative cursor-pointer rounded-lg overflow-hidden border transition-all ${
                  isSelected ? 'border-gold ring-1 ring-gold' : 'border-border-light hover:border-gold/50'
                }`}
              >
                <div className="aspect-[3/4] relative bg-muted">
                  <OptimizedImage
                    src={product.primary_image}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-gold/10 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-gold text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-surface">
                  <p className="text-xs font-medium line-clamp-1">{product.title}</p>
                  <p className="text-xs text-text-secondary">{formatCurrency(product.price)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
