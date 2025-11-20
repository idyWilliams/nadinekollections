import { NextResponse } from "next/server";
import { initializeTransaction } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amount, orderId } = body;

    if (!email || !amount || !orderId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a unique reference
    // Format: NK-{orderId}-{timestamp}
    const reference = `NK-${orderId}-${Date.now()}`;

    // Initialize Paystack transaction
    // In a real app, we would pass the callback URL to redirect back to the site
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?ref=${reference}`;

    const paystackResponse = await initializeTransaction(
      email,
      amount,
      reference,
      callbackUrl
    );

    // Update order with reference (optional but good for tracking)
    const supabase = await createClient();
    await supabase
      .from("orders")
      .update({ payment_reference: reference })
      .eq("id", orderId);

    return NextResponse.json(paystackResponse.data);
  } catch (error: any) {
    console.error("Paystack initialization error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
