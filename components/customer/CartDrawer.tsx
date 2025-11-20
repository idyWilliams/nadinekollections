"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Drawer } from "vaul";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useEffect, useState } from "react";

export function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, subtotal } = useCartStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const CartContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light p-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Your Cart ({items.length})
        </h2>
        <button
          onClick={toggleCart}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <ShoppingBag className="h-16 w-16 text-text-muted" />
            <p className="text-text-secondary">Your cart is empty</p>
            <Button onClick={toggleCart}>Start Shopping</Button>
          </div>
        ) : (
          items.map((item) => (
            <div key={`${item.id}-${item.variantId}`} className="flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-medium line-clamp-1">{item.title}</h3>
                  {item.variantName && (
                    <p className="text-sm text-text-muted">{item.variantName}</p>
                  )}
                  <p className="font-bold text-primary">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-md border border-border-light p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id, item.variantId)}
                    className="text-sm text-error hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t border-border-light p-4 space-y-4 bg-surface">
          <div className="flex justify-between text-lg font-bold">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal())}</span>
          </div>
          <p className="text-xs text-text-muted text-center">
            Shipping and taxes calculated at checkout.
          </p>
          <Link href="/checkout" onClick={toggleCart}>
            <Button className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={toggleCart}>
            Continue Shopping
          </Button>
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleCart}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl"
            >
              <CartContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && toggleCart()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="p-4 bg-surface rounded-t-[10px] flex-1 overflow-hidden">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
            <div className="h-full overflow-hidden">
               <CartContent />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
