"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileFilterSheet({ isOpen, onClose, children }: MobileFilterSheetProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] rounded-t-3xl bg-surface p-6 shadow-2xl md:hidden overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Filters & Sort</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-6 pb-20">
              {children}
            </div>

            {/* Sticky Footer for Apply Button (Optional, can be added if needed) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-border-light">
                <Button className="w-full" size="lg" onClick={onClose}>
                    Show Results
                </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
