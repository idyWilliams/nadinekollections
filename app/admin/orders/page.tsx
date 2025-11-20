"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrders = async () => {
      // In a real app, fetch from Supabase
      // const { data } = await supabase.from('orders').select('*, profiles(email)').order('created_at', { ascending: false });

      // Mock data
      setOrders([
        { id: "ORD-001", customer: "John Doe", email: "john@example.com", total: 45000, status: "Pending", date: "2024-03-15", items: 3 },
        { id: "ORD-002", customer: "Jane Smith", email: "jane@example.com", total: 12500, status: "Processing", date: "2024-03-14", items: 1 },
        { id: "ORD-003", customer: "Mike Johnson", email: "mike@example.com", total: 89000, status: "Shipped", date: "2024-03-14", items: 5 },
        { id: "ORD-004", customer: "Sarah Williams", email: "sarah@example.com", total: 32000, status: "Delivered", date: "2024-03-13", items: 2 },
        { id: "ORD-005", customer: "Chris Evans", email: "chris@example.com", total: 15000, status: "Delivered", date: "2024-03-12", items: 1 },
      ]);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-text-secondary">Manage customer orders.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-card border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-text-secondary font-medium border-b border-border-light">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customer}</div>
                    <div className="text-xs text-text-secondary">{order.email}</div>
                  </td>
                  <td className="px-6 py-4">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      order.status === 'Delivered' ? 'success' :
                      order.status === 'Processing' ? 'warning' :
                      order.status === 'Shipped' ? 'default' : 'secondary'
                    }>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
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
