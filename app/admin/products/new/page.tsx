"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import Image from "next/image";

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // Simple form state for demo
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "Women",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, upload to Supabase Storage here
    // For now, we'll just use a placeholder to simulate
    if (e.target.files && e.target.files[0]) {
      const fakeUrl = URL.createObjectURL(e.target.files[0]);
      setImages([...images, fakeUrl]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Create slug from title
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const { error } = await supabase.from("products").insert({
        title: formData.title,
        slug,
        description: formData.description,
        price: parseFloat(formData.price),
        category: [formData.category],
        primary_image: images[0] || "https://placehold.co/800x800?text=No+Image",
        gallery_images: images.slice(1),
        is_active: true,
      });

      if (error) throw error;

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-text-secondary">Create a new product for your store.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-surface p-6 rounded-xl border border-border-light">
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Title</label>
          <Input
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Summer Floral Dress"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Product description..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Price (NGN)</label>
            <Input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Women">Women</option>
              <option value="Men">Men</option>
              <option value="Kids">Kids</option>
              <option value="Accessories">Accessories</option>
              <option value="Gadgets">Gadgets</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Images</label>
          <div className="flex flex-wrap gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border-light">
                <Image src={img} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white hover:bg-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-light hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload className="h-6 w-6 text-text-muted" />
              <span className="mt-2 text-xs text-text-muted">Upload</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
