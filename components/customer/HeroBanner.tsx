"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  display_order: number;
}

interface HeroBannerProps {
  initialBanners?: Banner[];
}

export function HeroBanner({ initialBanners = [] }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [loading, setLoading] = useState(initialBanners.length === 0);

  useEffect(() => {
    if (initialBanners.length > 0) return;

    const fetchBanners = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("banner_ads")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) {
          console.error("Error fetching banners:", error);
          return;
        }

        if (data && data.length > 0) {
          setBanners(data);
        }
      } catch (error) {
        console.error("Error in fetchBanners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [initialBanners.length]);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  if (loading || banners.length === 0) {
    return (
      <div className="relative h-[500px] w-full overflow-hidden md:h-[70vh] md:max-h-[800px] bg-surface">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-muted/20 to-muted/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden md:h-[70vh] md:max-h-[800px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <OptimizedImage
            src={banners[current].image_url}
            alt={banners[current].title || "Banner"}
            fill
            className="object-cover"
            priority={current === 0}
            loading={current === 0 ? "eager" : "lazy"}
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="container px-4">
              {banners[current].subtitle && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mb-3 md:mb-4 text-base md:text-lg font-medium uppercase tracking-widest text-white/95"
                >
                  {banners[current].subtitle}
                </motion.p>
              )}
              {banners[current].title && (
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="mb-6 md:mb-8 text-3xl sm:text-4xl font-bold md:text-6xl lg:text-7xl text-white drop-shadow-lg"
                >
                  {banners[current].title}
                </motion.h1>
              )}
              {banners[current].cta_text && banners[current].cta_link && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link href={banners[current].cta_link || "#"}>
                    <Button size="lg" className="shadow-lg">
                      {banners[current].cta_text}
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/40 md:left-8"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/40 md:right-8"
            aria-label="Next banner"
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </button>

          <div className="absolute bottom-6 md:bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2 rounded-full transition-all ${
                  index === current ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
