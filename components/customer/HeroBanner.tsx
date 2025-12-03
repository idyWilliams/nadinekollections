"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const banners = [
  {
    id: 1,
    title: "Adorable Styles for Little Ones",
    subtitle: "Kids Collection",
    image: "/banners/nano_kids.png",
    cta: "Shop Kids",
    link: "/shop/kids",
    color: "text-white",
  },
  {
    id: 2,
    title: "Timeless Elegance",
    subtitle: "Women's Fashion",
    image: "/banners/nano_women.png",
    cta: "Explore Women",
    link: "/shop/women",
    color: "text-white",
  },
  {
    id: 3,
    title: "Refined Menswear",
    subtitle: "Men's Collection",
    image: "/banners/nano_men_v2.png",
    cta: "Discover Men",
    link: "/shop/men",
    color: "text-white",
  },
  {
    id: 4,
    title: "Smart Accessories",
    subtitle: "Tech & Gadgets",
    image: "/banners/nano_accessories.png",
    cta: "Shop Now",
    link: "/shop/accessories",
    color: "text-text-primary",
  },
  {
    id: 5,
    title: "Next Gen Tech",
    subtitle: "Latest Gadgets",
    image: "/banners/nano_gadgets.png",
    cta: "Explore Gadgets",
    link: "/shop/gadgets",
    color: "text-text-primary",
  },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

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
            src={banners[current].image}
            alt={banners[current].title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={100}
          />

          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="container px-4">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`mb-4 text-lg font-medium uppercase tracking-widest ${banners[current].color}`}
              >
                {banners[current].subtitle}
              </motion.p>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`mb-8 text-4xl font-bold md:text-6xl lg:text-7xl ${banners[current].color}`}
              >
                {banners[current].title}
              </motion.h1>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link href={banners[current].link}>
                  <Button size="lg" className="shadow-glow">
                    {banners[current].cta}
                  </Button>
                </Link>
              </motion.div>
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
            className={`h-2 rounded-full transition-all ${
              index === current ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
