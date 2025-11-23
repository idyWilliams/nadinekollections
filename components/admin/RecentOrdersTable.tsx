
"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Truck,
  RotateCcw,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Order {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: string;
  items: number;
}

interface RecentOrdersTableProps {
  orders: Order[];
}

export function RecentOrdersTable({ orders: initialOrders }: RecentOrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>(null);

  // Filter and Sort Logic
  const filteredOrders = initialOrders.filter(order =>
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof Order) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border-light bg-surface overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="bg-muted/50 [&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-primary" onClick={() => requestSort('id')}>
                  Order ID <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-primary" onClick={() => requestSort('customer')}>
                  Customer <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-primary" onClick={() => requestSort('date')}>
                  Date <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Items</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-primary" onClick={() => requestSort('status')}>
                  Status <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right cursor-pointer hover:text-primary" onClick={() => requestSort('total')}>
                  Total <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {sortedOrders.map((order) => (
                <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{order.id}</td>
                  <td className="p-4 align-middle">{order.customer}</td>
                  <td className="p-4 align-middle">{order.date}</td>
                  <td className="p-4 align-middle">{order.items}</td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      order.status === "Delivered" ? "bg-success/10 text-success" :
                      order.status === "Shipped" ? "bg-blue-100 text-blue-800" :
                      order.status === "Processing" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right font-medium">{formatCurrency(order.total)}</td>
                  <td className="p-4 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-error">
                            <RotateCcw className="mr-2 h-4 w-4" /> Refund Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
