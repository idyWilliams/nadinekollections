"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Search, User as UserIcon, Menu, LogOut, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { SearchInput } from "@/components/shared/SearchInput";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { toggleCart, items } = useCartStore();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-light bg-surface/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -ml-2 hover:bg-muted/20 rounded-full transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open Menu"
        >
          <Menu className="h-6 w-6 text-text-primary" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="NadineKollections"
            width={200}
            height={80}
            priority
            className="h-36 w-auto" // adjust h-6 / h-8 / h-10 as needed
          />
        </Link>


        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/shop/women" className="text-sm font-medium hover:text-primary transition-colors">
            Women
          </Link>
              <Link href="/shop" className="text-sm font-medium hover:text-primary transition-colors">
                Shop
              </Link>
              <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              {/* <div className="h-4 w-px bg-border-light mx-2" /> */}
              <Link href="/studio" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:shadow-lg hover:scale-105 transition-all duration-300">
                <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
                <span>Virtual Studio</span>
              </Link>
          <Link href="/shop/men" className="text-sm font-medium hover:text-primary transition-colors">
            Men
          </Link>
          <Link href="/shop/kids" className="text-sm font-medium hover:text-primary transition-colors">
            Kids
          </Link>
          <Link href="/shop/accessories" className="text-sm font-medium hover:text-primary transition-colors">
            Accessories
          </Link>
          <Link href="/shop/gadgets" className="text-sm font-medium hover:text-primary transition-colors">
            Gadgets
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Desktop Search */}
          <div className="hidden md:block w-64">
            <SearchInput className="w-full" />
          </div>

          {/* Mobile Search Toggle */}
          <button
            className="md:hidden p-2 hover:bg-muted/20 rounded-full transition-colors"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Toggle Search"
          >
            <Search className="h-5 w-5 text-text-primary" />
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Link href="/account">
                <Button variant="ghost" size="icon" className="hidden md:flex" title="Account">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={handleLogout}
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden md:flex font-medium">
                Sign In
              </Button>
            </Link>
          )}

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="relative" title="Wishlist">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>

          <Button variant="primary" size="icon" className="relative" onClick={toggleCart}>
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white shadow-sm">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border-light bg-surface px-4 py-4 absolute top-full left-0 w-full shadow-md"
          >
            <SearchInput
              className="w-full"
              autoFocus
              onSearch={() => setIsSearchOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border-light bg-surface px-4 py-4"
          >
            <nav className="flex flex-col gap-4">
              <SearchInput
                className="w-full"
                onSearch={() => setIsMobileMenuOpen(false)}
              />
              <Link
                href="/shop/kids"
                className="text-sm font-medium text-text-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Kids
              </Link>
              <Link
                href="/shop/women"
                className="text-sm font-medium text-text-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Women
              </Link>
              <Link
                href="/shop/men"
                className="text-sm font-medium text-text-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Men
              </Link>
              <Link
                href="/shop/accessories"
                className="text-sm font-medium text-text-secondary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Accessories
              </Link>
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="text-sm font-medium text-text-secondary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-sm font-medium text-text-secondary text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-text-secondary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
