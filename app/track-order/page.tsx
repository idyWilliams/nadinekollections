"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Truck, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const supabase = createClient();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);
    setHasSearched(true);

    try {
      // Search by order_number (e.g., ORD-12345) or ID
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`order_number.eq.${orderId},id.eq.${orderId}`)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Order not found");

      setOrder(data);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("We couldn't find an order with that ID. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-12 w-12 text-success" />;
      case "shipped":
        return <Truck className="h-12 w-12 text-primary" />;
      case "cancelled":
        return <XCircle className="h-12 w-12 text-error" />;
      default:
        return <Package className="h-12 w-12 text-secondary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-success/10 text-success border-success/20";
      case "shipped":
        return "bg-primary/10 text-primary border-primary/20";
      case "cancelled":
        return "bg-error/10 text-error border-error/20";
      case "processing":
        return "bg-warning/10 text-warning-foreground border-warning/20";
      default:
        return "bg-muted text-text-muted border-border-light";
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Track Your Order</h1>
          <p className="text-text-secondary">
            Enter your Order ID to check the current status.
          </p>
        </div>

        <Card className="border-border-light shadow-card bg-surface">
          <CardContent className="pt-6">
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter Order ID (e.g., ORD-12345)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="h-12 text-lg text-center tracking-wider uppercase placeholder:normal-case"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold shadow-glow"
                disabled={loading || !orderId}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Tracking...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-5 w-5" /> Track Order
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-center gap-3 text-error"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {order && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-border-light shadow-card bg-surface overflow-hidden">
                <div className="bg-muted/30 p-6 flex flex-col items-center text-center border-b border-border-light">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mb-4"
                  >
                    {getStatusIcon(order.order_status)}
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-1">
                    {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                  </h2>
                  <p className="text-text-secondary">
                    Last updated: {new Date(order.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border-light">
                    <span className="text-text-secondary">Order Number</span>
                    <span className="font-mono font-medium">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-light">
                    <span className="text-text-secondary">Date Placed</span>
                    <span className="font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-light">
                    <span className="text-text-secondary">Total Amount</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {order.tracking_number && (
                    <div className="bg-primary/5 rounded-lg p-4 mt-4">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Tracking Number</p>
                      <p className="font-mono font-bold text-lg">{order.tracking_number}</p>
                      {order.tracking_carrier && (
                        <p className="text-sm text-text-secondary mt-1">via {order.tracking_carrier}</p>
                      )}
                    </div>
                  )}

                  <div className="pt-4">
                    <Link href={order.user_id ? `/account/orders/${order.id}` : "/login"}>
                      <Button variant="outline" className="w-full">
                        View Full Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
