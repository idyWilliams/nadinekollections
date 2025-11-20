import { verifyTransaction } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref: string }>;
}) {
  const { ref } = await searchParams;

  if (!ref) {
    redirect("/");
  }

  let success = false;
  let message = "";

  try {
    // Verify transaction
    const data = await verifyTransaction(ref);

    if (data.status === true && data.data.status === "success") {
      success = true;

      // Update order status in Supabase
      const supabase = await createClient();

      // Extract order ID from reference if possible, or find by reference
      // Reference format: NK-{orderId}-{timestamp}
      const parts = ref.split("-");
      const orderId = parts[1];

      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "Paid", payment_status: "paid" })
          .eq("id", orderId);
      }
    } else {
      message = "Payment verification failed.";
    }
  } catch (error) {
    console.error("Verification error:", error);
    message = "An error occurred while verifying your payment.";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-xl shadow-card text-center space-y-6 border border-border-light">
        {success ? (
          <>
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-text-secondary">
              Your order has been confirmed. You will receive an email confirmation shortly.
            </p>
            <div className="pt-4">
              <Link href="/account">
                <Button className="w-full btn-primary">View Order</Button>
              </Link>
            </div>
            <Link href="/">
              <Button variant="ghost" className="w-full">Continue Shopping</Button>
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold">Payment Failed</h1>
            <p className="text-text-secondary">
              {message || "We couldn't verify your payment. Please try again or contact support."}
            </p>
            <div className="pt-4">
              <Link href="/checkout">
                <Button className="w-full btn-primary">Try Again</Button>
              </Link>
            </div>
            <Link href="/">
              <Button variant="ghost" className="w-full">Return Home</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
