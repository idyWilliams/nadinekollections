"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  BarChart,
  X,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Tag },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Bulk Orders", href: "/admin/bulk-orders", icon: Package },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Marketing", href: "/admin/marketing", icon: BarChart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // 1. Log the logout activity
      await fetch("/api/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "logout",
          entityType: "user",
          entityName: "Admin",
          details: "Admin logged out successfully",
          path: pathname,
        }),
      }).catch((e) => console.warn("Failed to log logout activity", e));

      // 2. Perform sign out
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 3. Redirect to login
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setSigningOut(false);
      if (onClose) onClose();
    }
  };

  return (
    <aside className="h-screen w-64 border-r border-border-light bg-surface">
      <div className="flex h-16 items-center justify-between border-b border-border-light px-6">
        <Link href="/" className="text-xl font-bold text-primary">
          NadineAdmin
        </Link>
        {/* Close button for mobile */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex h-[calc(100vh-4rem)] flex-col justify-between p-4">
        <nav className="space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-error hover:bg-error/5 transition-colors disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
