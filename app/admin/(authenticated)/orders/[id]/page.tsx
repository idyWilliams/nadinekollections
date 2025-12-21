"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, MapPin, Package, Printer, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { InfoModal } from "@/components/ui/info-modal";

interface OrderItem {
    title: string;
    quantity: number;
    price: number;
    image?: string;
    variant?: string;
}

interface ShippingAddress {
    line1: string;
    city: string;
    state: string;
    zip: string;
}

interface Order {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    total_amount: number;
    subtotal_amount: number;
    shipping_cost: number;
    discount_amount: number;
    items: OrderItem[];
    shipping_address: ShippingAddress;
    customer_name: string;
    customer_phone: string;
    guest_email: string;
    payment_method?: string;
    payment_status?: string;
    user?: {
        full_name: string;
        email: string;
        phone: string;
    };
}

export default function AdminOrderDetailsPage() {
    const params = useParams();
    const { id } = params;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

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

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
            *,
            user:profiles(full_name, email, phone)
          `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setOrder(data);
            } catch (err) {
                console.error("Error fetching order:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, supabase]);

    const handleMarkShipped = async () => {
        if (!order) return;
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'shipped' })
                .eq('id', order.id);

            if (error) throw error;

            setOrder({ ...order, status: 'shipped' });
            setModalState({
                isOpen: true,
                type: "success",
                title: "Order Updated",
                message: "Order has been marked as shipped."
            });
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

    if (loading) {
        return (
            <div className="min-h-screen bg-background py-12 px-4 md:px-8 flex items-center justify-center">
                <div className="animate-pulse text-text-secondary">Loading order details...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background py-12 px-4 md:px-8 flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <p className="text-text-secondary">We couldn&apos;t find the order you&apos;re looking for.</p>
                <Link href="/admin/orders">
                    <Button>Back to Orders</Button>
                </Link>
            </div>
        );
    }

    // Parse items if they are stored as JSON string, otherwise use as is
    const orderItems: OrderItem[] = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const shippingAddress: ShippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

    return (
        <div className="min-h-screen bg-background py-8 px-4 md:px-8">
            <InfoModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
            />

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/orders">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                Order {order.order_number || order.id.slice(0, 8)}
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${order.status === 'delivered' ? 'bg-success/10 text-success border-success/20' :
                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                order.status === 'cancelled' || order.status === 'failed' ? 'bg-error/10 text-error border-error/20' :
                                                    'bg-muted text-text-muted border-border-light'
                                    }`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </h1>
                            <p className="text-text-secondary">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Print Invoice
                        </Button>
                        {order.status !== 'shipped' && order.status !== 'delivered' && (
                            <Button onClick={handleMarkShipped}>
                                <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                            </Button>
                        )}
                    </div>
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
                                {orderItems && orderItems.map((item: OrderItem, index: number) => (
                                    <div key={index} className="p-6 flex gap-4">
                                        <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                            {item.image ? (
                                                <OptimizedImage
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted text-text-muted">
                                                    <Package className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium">{item.title}</h3>
                                            {item.variant && <p className="text-sm text-text-secondary">{item.variant}</p>}
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
                                    <span>{formatCurrency(order.subtotal_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Shipping</span>
                                    <span>{formatCurrency(order.shipping_cost || 0)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-success">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(order.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-border-light pt-4 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.total_amount)}</span>
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
                                <p className="font-medium">{order.customer_name || 'Guest'}</p>
                                <p className="text-text-secondary">{order.guest_email || order.user?.email}</p>
                                <p className="text-text-secondary">{order.customer_phone || order.user?.phone}</p>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {shippingAddress && (
                            <div className="bg-surface rounded-xl shadow-card border border-border-light p-6 space-y-4">
                                <h2 className="font-bold flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Shipping Address
                                </h2>
                                <div className="space-y-1 text-sm text-text-secondary">
                                    <p>{shippingAddress.line1}</p>
                                    <p>{shippingAddress.city}, {shippingAddress.state}</p>
                                    <p>{shippingAddress.zip}</p>
                                </div>
                            </div>
                        )}

                        {/* Payment Info */}
                        <div className="bg-surface rounded-xl shadow-card border border-border-light p-6 space-y-4">
                            <h2 className="font-bold">Payment Information</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Method</span>
                                    <span className="font-medium capitalize">{order.payment_method?.replace('_', ' ') || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Status</span>
                                    <span className={`font-medium capitalize ${order.payment_status === 'paid' ? 'text-success' :
                                            order.payment_status === 'failed' ? 'text-error' : 'text-warning-foreground'
                                        }`}>
                                        {order.payment_status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
