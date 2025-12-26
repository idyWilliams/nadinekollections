
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
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { InfoModal } from "@/components/ui/info-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // React Query for Orders
  const { data: orders = initialOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, total_amount, status, user_id, customer_name, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return data.map(order => {
        const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;

        const fullName = profile?.full_name || order.customer_name || "Guest User";

        return {
          id: order.id,
          customer: fullName,
          total: order.total_amount || 0,
          status: order.status || "Pending",
          date: new Date(order.created_at).toLocaleDateString(),
          items: 1
        };
      });
    },
    initialData: initialOrders,
    staleTime: 1000 * 60, // 1 minute
  });

  // Filter and Sort Logic
  const filteredOrders = orders.filter(order =>
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

  const handleMarkShipped = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', orderId);

      if (error) throw error;

      setModalState({
        isOpen: true,
        type: "success",
        title: "Order Updated",
        message: "Order has been marked as shipped."
      });

      // Invalidate query to refresh data seamlessly
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (error) {
      console.error("Error updating order:", error);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: "Failed to update order status."
      });
    }
  };

  const handleViewDetails = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  const handlePrintLabel = () => {
    // In a real app, this would generate a PDF or open a print dialog
    window.print();
  };

  return (
    <div className="space-y-4">
      <InfoModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />

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
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border border-border-light bg-surface overflow-hidden">
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
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${order.status === "Delivered" || order.status === "delivered" ? "bg-success/10 text-success" :
                      order.status === "Shipped" || order.status === "shipped" ? "bg-blue-100 text-blue-800" :
                        order.status === "Processing" || order.status === "processing" ? "bg-yellow-100 text-yellow-800" :
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
                        <DropdownMenuItem onClick={() => handleViewDetails(order.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkShipped(order.id)}>
                          <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintLabel()}>
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedOrders.map((order) => (
          <div key={order.id} className={`bg-surface rounded-lg border border-border-light p-4 shadow-sm ${selectedOrders.includes(order.id) ? 'ring-2 ring-primary/20' : ''}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleSelect(order.id)}>
                  {selectedOrders.includes(order.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-text-muted" />}
                </button>
                <div>
                  <span className="text-xs text-text-muted">Order ID</span>
                  <p className="font-medium">{order.id}</p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${order.status === "Delivered" || order.status === "delivered" ? "bg-success/10 text-success" :
                order.status === "Shipped" || order.status === "shipped" ? "bg-blue-100 text-blue-800" :
                  order.status === "Processing" || order.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                }`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 pl-8">
              <div>
                <span className="text-xs text-text-muted">Customer</span>
                <p className="text-sm">{order.customer}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Date</span>
                <p className="text-sm">{order.date}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Items</span>
                <p className="text-sm">{order.items}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Total</span>
                <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border-light pl-8">
              <Button variant="outline" size="sm" className="h-8" onClick={() => handleViewDetails(order.id)}>
                <Eye className="h-3 w-3 mr-1" /> View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleMarkShipped(order.id)}>
                    <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrintLabel()}>
                    <Printer className="mr-2 h-4 w-4" /> Print Label
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-error">
                    <RotateCcw className="mr-2 h-4 w-4" /> Refund Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
