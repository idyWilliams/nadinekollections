import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

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
      const { reference } = event.data;

      // Extract order ID from reference (NK-{orderId}-{timestamp})
      // Or use metadata if we passed it

      // Assuming format NK-{orderId}-{timestamp}
      // If orderId contains hyphens (UUID), this split might be tricky.
      // Better to rely on metadata or a more robust parsing if using UUIDs.
      // For now, let's assume we can find the order by reference in DB.

      const supabase = await createClient();

      // Find order by reference
      const { data: order, error: findError } = await supabase
        .from("orders")
        .select("id, user_id, metadata, total_amount")
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

      // Send Notifications
      const orderIdShort = order.id.slice(0, 8);
      const amountFormatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(order.total_amount);

      // Notify Admin
      await createNotification({
        type: 'success',
        title: 'Payment Received',
        message: `Payment of ${amountFormatted} received for Order #${orderIdShort}`,
        link: `/admin/orders/${order.id}`,
      });

      // Notify Customer
      if (order.user_id) {
        await createNotification({
          userId: order.user_id,
          type: 'success',
          title: 'Payment Successful',
          message: `We have received your payment for Order #${orderIdShort}.`,
          link: `/account/orders/${order.id}`,
          sendEmailTo: order.metadata?.email
        });
      } else if (order.metadata?.email) {
        // Guest Email
        await sendEmail({
          to: order.metadata.email,
          subject: `Payment Receipt - Order #${orderIdShort}`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h2>Payment Successful</h2>
              <p>We have received your payment of <strong>${amountFormatted}</strong> for Order #${orderIdShort}.</p>
              <p>Your order is now being processed.</p>
              <hr />
              <p style="font-size: 12px; color: #666;">NadineKollections</p>
            </div>
          `
        });
      }
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
