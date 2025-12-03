"use client";

import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Download, Share2, Sparkles, RotateCw } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  price: number;
  primary_image: string;
  category: string[];
}

interface TryOnCanvasProps {
  image: string | null;
  isGenerating: boolean;
  activeItem: Product | null;
}

export function TryOnCanvas({ image, isGenerating }: TryOnCanvasProps) {
  const handleDownload = async () => {
    if (!image) return;

    // Client-side watermarking logic
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.src = image;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx?.drawImage(img, 0, 0);

      // Add Watermark Text
      if (ctx) {
        ctx.font = "bold 48px serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        ctx.fillText("NadineKollections", canvas.width / 2, canvas.height - 50);

        ctx.font = "24px sans-serif";
        ctx.fillText("nadinekollections.com", canvas.width / 2, canvas.height - 20);
      }

      // Trigger Download
      const link = document.createElement("a");
      link.download = `nadine-style-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded with watermark!");
    };
  };

  const handleShare = () => {
    if (navigator.share && image) {
      navigator.share({
        title: 'My NadineKollections Look',
        text: 'Check out this style I created with NadineKollections Virtual Studio!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      toast.info("Sharing not supported on this device, try downloading instead.");
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-muted/30 to-muted/10">
      <div className="relative w-full max-w-xl aspect-[3/4] rounded-[2rem] overflow-hidden flex items-center justify-center transition-all duration-500 shadow-[0_0_50px_rgba(0,0,0,0.1)] border-8 border-white/50 backdrop-blur-xl ring-1 ring-gold/30 group">

        {/* Magic Mirror Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-white/10 opacity-50 pointer-events-none z-10" />
        <div className="absolute -inset-4 bg-gradient-to-r from-gold/10 via-purple-500/5 to-gold/10 blur-3xl -z-10 opacity-60" />

        {/* Background Pattern/Placeholder */}
        {!image && !isGenerating && (
          <div className="text-center space-y-6 p-10 relative z-0">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-gold/10 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-gold" />
              </div>
              <div className="absolute inset-0 border border-gold/20 rounded-full animate-[spin_10s_linear_infinite]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-heading font-bold text-primary bg-clip-text text-transparent bg-gradient-to-r from-gold to-primary/80">
                Magic Mirror
              </h2>
              <p className="text-text-secondary max-w-xs mx-auto font-medium leading-relaxed">
                Select your model & wardrobe to instantly visualize your perfect look.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
            </div>
            <p className="mt-4 font-medium text-primary animate-pulse">Creating your look...</p>
            <p className="text-sm text-text-secondary">This uses AI and might take a few seconds.</p>
          </div>
        )}

        {/* Result Image */}
        {image && (
          <>
            <OptimizedImage
              src={image}
              alt="Virtual Try-On Result"
              fill
              className="object-cover"
              priority
            />

            {/* Watermark Overlay (Visible on screen too) */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              <p className="text-white/90 font-heading font-bold text-xl drop-shadow-md">NadineKollections</p>
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={handleDownload}>
                <Download className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                <RotateCw className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
