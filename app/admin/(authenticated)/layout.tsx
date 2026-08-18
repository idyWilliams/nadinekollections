"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Search, Menu } from "lucide-react";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

function getPageFriendlyName(pathname: string): string {
  if (pathname === "/admin") return "Admin Dashboard";
  if (pathname.startsWith("/admin/products/new")) return "Add New Product Form";
  if (pathname.includes("/edit")) return "Edit Product Settings";
  if (pathname.startsWith("/admin/products")) return "Products Inventory Grid";
  if (pathname.startsWith("/admin/orders")) return "Orders Management Page";
  if (pathname.startsWith("/admin/customers")) return "Customers List";
  if (pathname.startsWith("/admin/bulk-orders")) return "Bulk Orders Panel";
  if (pathname.startsWith("/admin/categories")) return "Categories Management";
  if (pathname.startsWith("/admin/settings")) return "Settings & Team Management";
  if (pathname.startsWith("/admin/promotions")) return "Promotions & Discounts";
  if (pathname.startsWith("/admin/marketing")) return "Marketing Panel";
  return pathname;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateLastSeen = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", user.id);
        }
      } catch (err) {
        console.error("Failed to update last_seen_at:", err);
      }
    };

    // Run immediately on mount
    updateLastSeen();

    // Run every 60 seconds
    intervalId = setInterval(updateLastSeen, 60000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [supabase]);

  // Log page view when pathname changes
  useEffect(() => {
    if (!pathname) return;

    const logPageView = async () => {
      try {
        const friendlyName = getPageFriendlyName(pathname);
        await fetch("/api/admin/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "view",
            entityType: "page",
            entityName: friendlyName,
            details: `Navigated to ${friendlyName}`,
            path: pathname,
          }),
        });
      } catch (err) {
        console.error("Failed to log page view:", err);
      }
    };

    logPageView();
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:fixed
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="lg:pl-64">
        {/* Admin Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-light bg-surface/80 px-4 md:px-8 backdrop-blur-md">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="hidden md:block w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search..."
                className="pl-10 bg-background border-transparent focus:bg-surface"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <NotificationCenter />
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              A
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
