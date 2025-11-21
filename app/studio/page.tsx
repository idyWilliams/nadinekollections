"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MannequinCustomizer } from "@/components/studio/MannequinCustomizer";
import { ProductSelector } from "@/components/studio/ProductSelector";
import { TryOnCanvas } from "@/components/studio/TryOnCanvas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shirt, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function StudioPage() {
  const [mannequinSettings, setMannequinSettings] = useState({
    gender: "female",
    skinTone: "medium",
    size: "medium",
    age: "young-adult"
  });

  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product to try on.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/try-on/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mannequinSettings,
          products: selectedProducts,
          guestId: "guest-123" // In real app, generate/retrieve from cookie
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setGeneratedImage(data.imageUrl);
      toast.success("Look generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate look");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Panel: Controls (Mobile: Bottom Sheet or Tabs) */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-border-light bg-surface flex flex-col h-[50dvh] md:h-screen overflow-hidden order-2 md:order-1 z-10 shadow-xl">
        <div className="p-5 border-b border-border-light bg-surface/95 backdrop-blur-sm z-10">
          <h1 className="text-2xl font-heading font-bold text-primary tracking-tight">Virtual Studio</h1>
          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mt-1">AI Style Assistant</p>
        </div>

        <Tabs defaultValue="mannequin" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="mannequin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
                <User className="h-4 w-4 mr-2" /> Model
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
                <Shirt className="h-4 w-4 mr-2" /> Wardrobe
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <TabsContent value="mannequin" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <MannequinCustomizer
                settings={mannequinSettings}
                onChange={setMannequinSettings}
              />
            </TabsContent>
            <TabsContent value="products" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ProductSelector
                selected={selectedProducts}
                onSelect={(p) => {
                  if (selectedProducts.find(i => i.id === p.id)) {
                    setSelectedProducts(selectedProducts.filter(i => i.id !== p.id));
                  } else {
                    setSelectedProducts([...selectedProducts, p]);
                  }
                }}
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-4 border-t border-border-light bg-surface z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sticky bottom-0">
          <Button
            className="w-full py-7 text-lg font-bold shadow-glow hover:shadow-glow-hover transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 animate-spin" /> Styling...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Try On Now
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Right Panel: Canvas (Preview) */}
      <div className="flex-1 bg-muted/10 relative h-[50vh] md:h-screen order-1 md:order-2">
        <TryOnCanvas
          image={generatedImage}
          isGenerating={isGenerating}
          products={selectedProducts}
        />
      </div>
    </div>
  );
}
