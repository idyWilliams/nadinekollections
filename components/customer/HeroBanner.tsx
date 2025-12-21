"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  display_order: number;
}

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  // Show loading skeleton or nothing if no banners
  if (loading || banners.length === 0) {
    return (
      <div className="relative h-[500px] w-full overflow-hidden md:h-[800px] bg-surface animate-pulse" />
    );
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden md:h-[800px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <OptimizedImage
            src={banners[current].image_url}
            alt={banners[current].title || "Banner"}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={100}
          />

          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="container px-4">
              {banners[current].subtitle && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4 text-lg font-medium uppercase tracking-widest text-white"
                >
                  {banners[current].subtitle}
                </motion.p>
              )}
              {banners[current].title && (
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8 text-4xl font-bold md:text-6xl lg:text-7xl text-white"
                >
                  {banners[current].title}
                </motion.h1>
              )}
              {banners[current].cta_text && banners[current].cta_link && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link href={banners[current].cta_link || "#"}>
                    <Button size="lg" className="shadow-glow">
                      {banners[current].cta_text}
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/40 md:left-8"
      >
        <ChevronLeft className="h-8 w-8 text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/40 md:right-8"
      >
        <ChevronRight className="h-8 w-8 text-white" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all ${index === current ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
