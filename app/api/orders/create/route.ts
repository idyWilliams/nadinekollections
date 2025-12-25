import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const orderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    quantity: z.number().min(1),
    price: z.number(),
    image: z.string().optional(),
    variantId: z.string().optional(),
  })),
  shippingDetails: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string().optional(),
    country: z.string().default("Nigeria"),
  }),
  total: z.number(),
  paymentReference: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = orderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { items, shippingDetails, total, paymentReference } = result.data;
    const supabase = await createClient();

    // Get user if authenticated (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Calculate amounts
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingCost = 2500; // Fixed shipping, should be based on zone
    const customerName = `${shippingDetails.firstName} ${shippingDetails.lastName}`;

    // 1. Create Order with all required fields
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id || null,
        guest_email: user ? null : shippingDetails.email,
        customer_name: customerName,
        total_amount: total,
        subtotal_amount: subtotal,
        shipping_cost: shippingCost,
        tax_amount: 0,
        discount_amount: 0,
        status: "pending",
        payment_status: paymentReference ? "paid" : "unpaid",
        payment_reference: paymentReference || null,
        payment_method: "paystack",
        shipping_address: shippingDetails,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation failed:", orderError);
      return NextResponse.json(
        { message: orderError?.message || "Failed to create order" },
        { status: 500 }
      );
    }

    // 2. Create Order Items
    const orderItemsData = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      variant_id: item.variantId || null,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      product_title: item.title,
      product_image: item.image || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) {
      console.error("Order items creation failed:", itemsError);
      // Cleanup: Delete the order if items failed
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { message: itemsError.message || "Failed to create order items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
      order: order,
    });
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
