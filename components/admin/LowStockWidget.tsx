
"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                    Only <span className="text-error font-bold">{item.stock}</span> left
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Restock
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
