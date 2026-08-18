
"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowRight, ShoppingCart, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

interface LowStockItem {
  id: string;
  title: string;
  stock: number;
  image: string;
}

interface LowStockWidgetProps {
  items: LowStockItem[];
}

export function LowStockWidget({ items }: LowStockWidgetProps) {
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({});

  const sendAlert = useCallback(async (item: LowStockItem) => {
    if (loadingIds[item.id] || sentIds[item.id]) return;

    setLoadingIds((prev) => ({ ...prev, [item.id]: true }));

    try {
      const res = await fetch("/api/restock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.id, triggeredBy: "manual" }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.info(`⏳ ${data.error}`);
        setSentIds((prev) => ({ ...prev, [item.id]: true }));
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to send");

      toast.success(
        `📧 Restock alert sent! ${data.emailsSent} admin${data.emailsSent !== 1 ? "s" : ""} notified about "${item.title}"`,
        { duration: 5000 }
      );
      setSentIds((prev) => ({ ...prev, [item.id]: true }));
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoadingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  }, [loadingIds, sentIds]);

  return (
    <Card className="border-none shadow-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alerts
        </CardTitle>
        <Link href="/admin/products?filter=low_stock">
          <Button variant="ghost" size="sm" className="text-xs">
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            No low stock items. Good job!
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-text-secondary">
                    Only{" "}
                    <span className={`font-bold ${item.stock < 2 ? "text-red-500" : "text-error"}`}>
                      {item.stock}
                    </span>{" "}
                    left
                    {item.stock < 2 && (
                      <span className="ml-1 text-red-500 font-semibold animate-pulse">
                        — CRITICAL
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={sentIds[item.id] ? "outline" : item.stock < 2 ? "destructive" : "outline"}
                  className={`h-7 text-xs gap-1 flex-shrink-0 transition-all ${
                    sentIds[item.id]
                      ? "border-green-500 text-green-600 hover:bg-green-50"
                      : item.stock < 2
                      ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      : "border-amber-500 text-amber-600 hover:bg-amber-50"
                  }`}
                  onClick={() => sendAlert(item)}
                  disabled={loadingIds[item.id] || sentIds[item.id]}
                  title={
                    sentIds[item.id]
                      ? "Alert already sent"
                      : "Send restock alert to management"
                  }
                >
                  {loadingIds[item.id] ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : sentIds[item.id] ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <ShoppingCart className="h-3 w-3" />
                  )}
                  {loadingIds[item.id]
                    ? "Sending…"
                    : sentIds[item.id]
                    ? "Sent ✓"
                    : "Restock"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
