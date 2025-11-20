import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!secret) {
      console.error("PAYSTACK_WEBHOOK_SECRET is not defined");
      return NextResponse.json({ message: "Configuration error" }, { status: 500 });
    }

    // Verify signature
    const signature = request.headers.get("x-paystack-signature");
    if (!signature) {
      return NextResponse.json({ message: "No signature provided" }, { status: 401 });
    }

    const body = await request.text();
    const hash = crypto
      .createHmac("sha512", secret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle successful payment
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;

      // Extract order ID from reference (NK-{orderId}-{timestamp})
      // Or use metadata if we passed it
      const parts = reference.split("-");
      // Assuming format NK-{orderId}-{timestamp}
      // If orderId contains hyphens (UUID), this split might be tricky.
      // Better to rely on metadata or a more robust parsing if using UUIDs.
      // For now, let's assume we can find the order by reference in DB.

      const supabase = await createClient();

      // Find order by reference
      const { data: order, error: findError } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_reference", reference)
        .single();

      if (findError || !order) {
        console.error(`Order not found for reference: ${reference}`);
        return NextResponse.json({ message: "Order not found" }, { status: 404 });
      }

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "processing", // Or 'paid' depending on workflow
          payment_status: "paid",
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("Failed to update order status:", updateError);
        return NextResponse.json({ message: "Database update failed" }, { status: 500 });
      }

      // Here we would also trigger email notifications
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
