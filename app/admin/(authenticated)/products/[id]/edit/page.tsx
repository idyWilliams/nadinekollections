"use client";

import { ProductForm } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      } else {
        setProduct(data);
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return <ProductForm initialData={product} isEditing={true} />;
}
