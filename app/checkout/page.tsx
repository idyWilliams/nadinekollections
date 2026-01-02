"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckCircle, CreditCard, MapPin, Tag, X } from "lucide-react";
import Image from "next/image";
import { useAfricaPay } from "@use-africa-pay/core";
import { InfoModal } from "@/components/ui/info-modal";

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ promo_id: string; discount: number; code: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [createAccount, setCreateAccount] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
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
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showModal = (type: "success" | "error" | "info", title: string, message: string, onAction?: () => void) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      onAction,
    });
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
        showModal("error", "Invalid Code", data.error || "Invalid promo code");
        return;
      }

      setAppliedPromo(data);
      showModal("success", "Promo Applied", `You saved ${formatCurrency(data.discount)}`);
    } catch {
      showModal("error", "Error", "Failed to apply promo code");
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

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("*")
        .single();

      setPaymentSettings({
        provider: data?.payment_provider || 'paystack',
        paystackPublicKey: data?.paystack_public_key || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        flutterwavePublicKey: data?.flutterwave_public_key || process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
        monnifyPublicKey: data?.monnify_public_key || process.env.NEXT_PUBLIC_MONNIFY_API_KEY,
        monnifyContractCode: data?.monnify_contract_code || process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE,
        remitaPublicKey: data?.remita_public_key || process.env.NEXT_PUBLIC_REMITA_PUBLIC_KEY,
        remitaMerchantId: data?.remita_merchant_id || process.env.NEXT_PUBLIC_REMITA_MERCHANT_ID,
        remitaServiceTypeId: data?.remita_service_type_id || process.env.NEXT_PUBLIC_REMITA_SERVICE_TYPE_ID,
      });
    };
    fetchSettings();
  }, [supabase]);

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    checkUser();
  }, [supabase]);

  const { initializePayment } = useAfricaPay();

  const handleInitiatePayment = async () => {
    if (!paymentSettings) {
      showModal("error", "Configuration Error", "Payment settings not loaded. Please try again.");
      return;
    }

    setLoading(true);

    try {
      let { data: { user } } = await supabase.auth.getUser();

      // If user wants to create account and is not already logged in
      if (createAccount && !user && formData.email && formData.password) {
        try {
          // Create account
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: `${formData.firstName} ${formData.lastName}`,
              },
            },
          });

          if (signUpError) {
            console.error("Account creation error:", signUpError);
            showModal("error", "Account Creation Failed", `${signUpError.message}. Continuing as guest.`);
          } else if (signUpData.user) {
            // Account created successfully, update user reference
            user = signUpData.user;
            console.log("Account created and user signed in automatically");
          }
        } catch (accountError) {
          console.error("Account creation error:", accountError);
          // Continue with guest checkout if account creation fails
        }
      }

      // 1. Create Order in Supabase (Pending Payment)
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const total = calculateTotal();
      const subtotalAmount = subtotal();

      const orderData = {
        user_id: user?.id || null,
        order_number: orderNumber,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_phone: formData.phone,
        guest_email: !user ? formData.email : null,
        subtotal_amount: subtotalAmount,
        shipping_cost: 0, // Schema uses shipping_cost
        tax_amount: 0, // Schema uses tax_amount
        total_amount: total, // Schema uses total_amount
        status: "pending", // Schema uses status, allows 'pending'
        payment_status: "unpaid", // Schema constraint requires 'unpaid' (not 'pending')
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
        showModal("error", "Order Failed", "Failed to create order. Please try again.");
        setLoading(false);
        return;
      }

      // 3. Initialize Payment with useAfricaPay
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config: any = {
        provider: paymentSettings.provider,
        amount: calculateTotal() * 100, // Amount in kobo
        currency: 'NGN',
        reference: order.id, // Use Order ID as reference
        user: {
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phonenumber: formData.phone,
        },
        onSuccess: async (response: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          console.log('Payment successful:', response);

          await supabase
            .from('orders')
            .update({
              status: 'processing',
              payment_status: 'paid',
              payment_reference: response.reference || response.transaction_id
            })
            .eq('id', order.id);

          setStep(3); // Move to confirmation
          clearCart();
          setLoading(false);
        },
        onClose: () => {
          console.log('Payment closed');
          setLoading(false);
        },
      };

      // Provider-specific config
      if (paymentSettings.provider === 'paystack') {
        config.publicKey = paymentSettings.paystackPublicKey;
      } else if (paymentSettings.provider === 'flutterwave') {
        config.publicKey = paymentSettings.flutterwavePublicKey;
      } else if (paymentSettings.provider === 'monnify') {
        config.publicKey = paymentSettings.monnifyPublicKey;
        config.contractCode = paymentSettings.monnifyContractCode;
      } else if (paymentSettings.provider === 'remita') {
        config.publicKey = paymentSettings.remitaPublicKey;
        config.merchantId = paymentSettings.remitaMerchantId;
        config.serviceTypeId = paymentSettings.remitaServiceTypeId;
      }

      initializePayment(config);

    } catch (error) {
      console.error("Checkout error:", error);
      showModal("error", "Error", "Something went wrong. Please try again.");
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
      <InfoModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onAction={modalState.onAction}
      />

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
                <label className="text-sm font-medium">Phone Number (WhatsApp)</label>
                <Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+234 800 000 0000" />
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


              {!currentUser && (
                <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border-light">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="createAccount"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <label htmlFor="createAccount" className="text-sm font-medium cursor-pointer">
                        Create an account for faster checkout next time
                      </label>
                      <p className="text-xs text-text-secondary mt-1">
                        We&apos;ll use your email and create a secure account for you automatically
                      </p>
                    </div>
                  </div>

                  {/* Conditional Password Field */}
                  {createAccount && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-sm font-medium">Create Password</label>
                      <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter a secure password (min 6 characters)"
                        minLength={6}
                        required={createAccount}
                      />
                      <p className="text-xs text-text-secondary">
                        Your account will be created automatically when you proceed to payment
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => router.push("/cart")}>
                  Back to Cart
                </Button>
                <Button className="flex-[2] btn-primary" onClick={() => setStep(2)}>
                  Continue to Payment
                </Button>
              </div>
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
                <Button className="flex-1 btn-primary" onClick={handleInitiatePayment} disabled={loading}>
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
