"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export function WhatsAppButton() {
  // In a real app, this would come from env or settings
  const phoneNumber = "2348000000000";
  const message = "Hello NadineKollections, I need assistance.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <MessageCircle className="h-8 w-8" />
        <span className="absolute right-full mr-4 hidden rounded bg-black/75 px-2 py-1 text-xs text-white md:group-hover:block">
          Chat with us
        </span>

        {/* Pulse Effect */}
        <span className="absolute inset-0 -z-10 rounded-full bg-[#25D366] opacity-75 animate-ping" />
      </motion.button>
    </Link>
  );
}
