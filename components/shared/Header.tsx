"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Search, User as UserIcon, Menu, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const NotificationCenter = dynamic(
  () => import("@/components/shared/NotificationCenter").then((m) => m.NotificationCenter),
  { ssr: false, loading: () => <div className="w-10 h-10" /> }
);

const SearchInput = dynamic(
  () => import("@/components/shared/SearchInput").then((m) => m.SearchInput),
  { ssr: false, loading: () => <div className="h-10 w-full bg-surface rounded-md" /> }
);

function CartCountBadge({ count }: { count: number }) {
  return count > 0 ? (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white shadow-sm">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;
}

interface HeaderActionsProps {
  user: User | null;
  itemCount: number;
  onLogout: () => Promise<void>;
  onToggleCart: () => void;
}

function HeaderActions({ user, itemCount, onLogout, onToggleCart }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      <div className="hidden md:block w-64">
        <Suspense fallback={<div className="h-10 w-full bg-surface rounded-md animate-pulse" />}>
          <SearchInput className="w-full" />
        </Suspense>
      </div>

      {user ? (
        <div className="flex items-center gap-1 md:gap-2">
          <Suspense fallback={<div className="w-10 h-10" />}>
            <NotificationCenter />
          </Suspense>
          <Link href="/account">
            <Button variant="ghost" size="icon" className="hidden md:flex" title="Account">
              <UserIcon className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={onLogout}
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

      <Button variant="primary" size="icon" className="relative" onClick={onToggleCart} aria-label="Open cart">
        <ShoppingBag className="h-5 w-5" />
        <CartCountBadge count={itemCount} />
      </Button>
    </div>
  );
}

function AuthActionsFallback({ itemCount, onToggleCart }: { itemCount: number; onToggleCart: () => void }) {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      <div className="hidden md:block w-64">
        <div className="h-10 w-full bg-surface rounded-md" />
      </div>
      <Link href="/login">
        <Button variant="ghost" size="sm" className="hidden md:flex font-medium">
          Sign In
        </Button>
      </Link>
      <Link href="/wishlist">
        <Button variant="ghost" size="icon" className="relative" title="Wishlist">
          <Heart className="h-5 w-5" />
        </Button>
      </Link>
      <Button variant="primary" size="icon" className="relative" onClick={onToggleCart} aria-label="Open cart">
        <ShoppingBag className="h-5 w-5" />
        <CartCountBadge count={itemCount} />
      </Button>
    </div>
  );
}

function MobileActions({
  isSearchOpen,
  setIsSearchOpen,
  user,
  onLogout,
}: {
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  user: User | null;
  onLogout: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        className="md:hidden p-2 -ml-2 hover:bg-muted/20 rounded-full transition-colors"
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        aria-label="Toggle Search"
      >
        <Search className="h-5 w-5 text-text-primary" />
      </button>
      {user && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:hidden"
          onClick={onLogout}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { toggleCart, items } = useCartStore();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let subscribed = true;
    let channelSub: { unsubscribe: () => void } | null = null;

    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (subscribed) {
        setUser(currentUser);
        setAuthReady(true);
      }

      const { data: subscriptionInfo } = supabase.auth.onAuthStateChange((_event, session) => {
        if (subscribed) {
          setUser(session?.user ?? null);
          setAuthReady(true);
        }
      });
      channelSub = subscriptionInfo.subscription;
    };

    void init();

    return () => {
      subscribed = false;
      if (channelSub) channelSub.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-light bg-surface/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4 flex-1 md:flex-none">
          <button
            className="md:hidden p-2 -ml-2 hover:bg-muted/20 rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Open Menu"
          >
            <Menu className="h-6 w-6 text-text-primary" />
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="NadineKollections"
              width={200}
              height={80}
              sizes="200px"
              className="h-12 md:h-14 w-auto"
              fetchPriority="high"
              loading="eager"
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-center">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/shop/women" className="text-sm font-medium hover:text-primary transition-colors">
            Women
          </Link>
          <Link href="/shop" className="text-sm font-medium hover:text-primary transition-colors">
            Shop
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

        <div className="flex-1 md:flex-none flex justify-end">
          {authReady ? (
            <HeaderActions
              user={user}
              itemCount={itemCount}
              onLogout={handleLogout}
              onToggleCart={toggleCart}
            />
          ) : (
            <AuthActionsFallback itemCount={itemCount} onToggleCart={toggleCart} />
          )}
          <MobileActions
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      </div>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border-light bg-surface px-4 py-4 absolute top-full left-0 w-full shadow-md"
          >
            <Suspense fallback={<div className="h-10 w-full bg-surface rounded-md animate-pulse" />}>
              <SearchInput
                className="w-full"
                autoFocus
                onSearch={() => setIsSearchOpen(false)}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border-light bg-surface px-4 py-4"
          >
            <nav className="flex flex-col gap-4">
              <Suspense fallback={<div className="h-10 w-full bg-surface rounded-md animate-pulse" />}>
                <SearchInput
                  className="w-full"
                  onSearch={() => setIsMobileMenuOpen(false)}
                />
              </Suspense>
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
              {authReady && user ? (
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
                      void handleLogout();
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
