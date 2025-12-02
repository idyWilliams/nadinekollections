"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckCircle, CreditCard, MapPin, Truck, Tag, X } from "lucide-react";
import Image from "next/image";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setPromoLoading(true);
    try {
      const response = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, orderTotal: subtotal() }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Invalid promo code");
        return;
      }

      setAppliedPromo(data);
      alert(`Promo code applied! You saved ${formatCurrency(data.discount)}`);
    } catch (error) {
      alert("Failed to apply promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  const calculateTotal = () => {
    const sub = subtotal();
    const discount = appliedPromo?.discount || 0;
    return sub - discount;
  };

  const handleSubmitOrder = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create Order in Supabase (Pending Payment)
      const orderData = {
        user_id: user?.id || null,
        total_amount: calculateTotal(),
        status: "Pending Payment",
        promotion_id: appliedPromo?.promo_id || null,
        shipping_address: {
          line1: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          variant: item.variantName
        }))
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("Order creation error:", orderError);
        // Fallback for demo if DB fails
        // throw new Error("Failed to create order");
      }

      // 2. Initialize Paystack
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          amount: calculateTotal(),
          orderId: order?.id || `DEMO-${Date.now()}`, // Fallback ID
        }),
      });

      const paystackData = await response.json();

      if (paystackData && paystackData.authorization_url) {
        // Redirect to Paystack
        window.location.href = paystackData.authorization_url;
      } else {
        throw new Error("Failed to initialize payment");
      }

    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => router.push("/")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Forms */}
        <div className="space-y-8">
          {/* Steps Indicator */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-text-muted"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-primary bg-primary text-white" : "border-text-muted"}`}>1</div>
              <span className="font-medium">Shipping</span>
            </div>
            <div className="w-12 h-px bg-border-light" />
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-text-muted"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-primary bg-primary text-white" : "border-text-muted"}`}>2</div>
              <span className="font-medium">Payment</span>
            </div>
            <div className="w-12 h-px bg-border-light" />
            <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-text-muted"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? "border-primary bg-primary text-white" : "border-text-muted"}`}>3</div>
              <span className="font-medium">Done</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6" /> Shipping Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input name="city" value={formData.city} onChange={handleInputChange} placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Input name="state" value={formData.state} onChange={handleInputChange} placeholder="NY" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ZIP</label>
                  <Input name="zip" value={formData.zip} onChange={handleInputChange} placeholder="10001" />
                </div>
              </div>
              <Button className="w-full btn-primary" onClick={() => setStep(2)}>
                Continue to Payment
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="h-6 w-6" /> Payment
              </h2>
              <div className="p-4 border border-border-light rounded-lg bg-surface/50">
                <p className="text-sm text-text-secondary mb-4">
                  You will be redirected to Paystack to complete your secure payment.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-500">VISA</div>
                  <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-500">MC</div>
                  <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-500">VERVE</div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button className="flex-1 btn-primary" onClick={handleSubmitOrder} disabled={loading}>
                  {loading ? "Processing..." : `Pay ${formatCurrency(calculateTotal())}`}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold">Order Confirmed!</h2>
              <p className="text-text-secondary max-w-md mx-auto">
                Thank you for your purchase. We have sent a confirmation email to {formData.email}.
              </p>
              <Button className="btn-primary" onClick={() => router.push("/")}>
                Return Home
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-surface border border-border-light rounded-lg p-6 shadow-card">
            <h3 className="text-xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.variantId}`} className="flex gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    {item.variantName && <p className="text-sm text-text-secondary">{item.variantName}</p>}
                    <p className="text-sm">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div className="border-t border-border-light pt-4 mb-4">
              {appliedPromo ? (
                <div className="bg-success/10 border border-success/20 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-success" />
                    <div>
                      <p className="text-sm font-medium text-success">{appliedPromo.code} Applied</p>
                      <p className="text-xs text-success/80">-{formatCurrency(appliedPromo.discount)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRemovePromo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                  >
                    {promoLoading ? "..." : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-border-light pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span>{formatCurrency(subtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Shipping</span>
                <span>Free</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-{formatCurrency(appliedPromo.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border-light">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
