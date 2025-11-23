
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
  Printer,
  CheckSquare,
  Square,
  Download,
  Trash
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

interface BulkOrdersTableProps {
  orders: Order[];
}

export function BulkOrdersTable({ orders: initialOrders }: BulkOrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
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

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary ml-2">
            {selectedOrders.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Truck className="h-4 w-4" /> Mark Shipped
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" /> Print Labels
            </Button>
            <Button variant="outline" size="sm" className="text-error hover:text-error border-error/20 hover:bg-error/10">
              <Trash className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-border-light bg-surface overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="bg-muted/50 [&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="w-10 px-4 py-3 align-middle">
                   <button onClick={toggleSelectAll}>
                      {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                   </button>
                </th>
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
                <tr key={order.id} className={`border-b transition-colors hover:bg-muted/50 ${selectedOrders.includes(order.id) ? 'bg-primary/5' : ''}`}>
                  <td className="p-4 align-middle">
                    <button onClick={() => toggleSelect(order.id)}>
                      {selectedOrders.includes(order.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-text-muted" />}
                    </button>
                  </td>
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
                        <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" /> Print Label
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
