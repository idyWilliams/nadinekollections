"use client";

import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Package, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real app, fetch from DB
      // const { data } = await supabase.from('orders').select('*').eq('user_id', user.id);
      // setOrders(data || []);

      // Mock data for now
      setOrders([
        { id: "ORD-001", date: "2024-03-15", status: "Processing", total: 45000, items: 3 },
        { id: "ORD-002", date: "2024-02-28", status: "Delivered", total: 12500, items: 1 },
      ]);
      setLoading(false);
    };

    fetchOrders();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-text-secondary">Manage your orders and settings</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-card border border-border-light overflow-hidden">
          <div className="p-6 border-b border-border-light">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5" /> Order History
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-text-secondary">Loading orders...</div>
          ) : orders.length > 0 ? (
            <div className="divide-y divide-border-light">
              {orders.map((order) => (
                <div key={order.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">{order.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-success/10 text-success' :
                        order.status === 'Processing' ? 'bg-warning/10 text-warning-foreground' :
                        'bg-muted text-text-muted'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Placed on {new Date(order.date).toLocaleDateString()} • {order.items} items
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                    <Link href={`/account/orders/${order.id}`} className="btn-outline py-2 px-4 text-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-text-secondary mb-4">You haven't placed any orders yet.</p>
              <Link href="/" className="btn-primary">Start Shopping</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
