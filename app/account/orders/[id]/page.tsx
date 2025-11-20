"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, MapPin, Package, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrderDetailsPage() {
  const params = useParams();
  const { id } = params;

  // Mock order data
  const order = {
    id: id,
    date: "2024-03-15",
    status: "Processing",
    total: 45000,
    subtotal: 42500,
    shipping: 2500,
    customer: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+234 800 000 0000",
    },
    shippingAddress: {
      line1: "123 Main Street",
      city: "Lekki",
      state: "Lagos",
      zip: "100001",
    },
    items: [
      {
        id: "1",
        title: "Kids Floral Dress",
        variant: "2-3 Years",
        price: 9500,
        quantity: 2,
        image: "/products/kids-1.png",
      },
      {
        id: "3",
        title: "Women Flashy Sequined Gown",
        variant: "Small - Gold",
        price: 42000,
        quantity: 1,
        image: "/products/women-1.png",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/account">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                Order {order.id}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'Delivered' ? 'bg-success/10 text-success' :
                  order.status === 'Processing' ? 'bg-warning/10 text-warning-foreground' :
                  'bg-muted text-text-muted'
                }`}>
                  {order.status}
                </span>
              </h1>
              <p className="text-text-secondary">Placed on {new Date(order.date).toLocaleDateString()}</p>
            </div>
          </div>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Items */}
            <div className="bg-surface rounded-xl shadow-card border border-border-light overflow-hidden">
              <div className="p-6 border-b border-border-light">
                <h2 className="font-bold flex items-center gap-2">
                  <Package className="h-5 w-5" /> Items
                </h2>
              </div>
              <div className="divide-y divide-border-light">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 flex gap-4">
                    <div className="w-20 h-20 bg-background rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-text-secondary">{item.variant}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Qty: {item.quantity}</span>
                        <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-surface rounded-xl shadow-card border border-border-light p-6 space-y-4">
              <h2 className="font-bold">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Shipping</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
                <div className="border-t border-border-light pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Customer Details */}
            <div className="bg-surface rounded-xl shadow-card border border-border-light p-6 space-y-4">
              <h2 className="font-bold">Customer</h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-text-secondary">{order.customer.email}</p>
                <p className="text-text-secondary">{order.customer.phone}</p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-surface rounded-xl shadow-card border border-border-light p-6 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Shipping Address
              </h2>
              <div className="space-y-1 text-sm text-text-secondary">
                <p>{order.shippingAddress.line1}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.zip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
