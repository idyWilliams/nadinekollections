import { NextResponse } from "next/server";
import { checkLowStockAndNotify } from "@/lib/check-low-stock";

// This endpoint can be called manually or by a cron job
// Example: Vercel Cron Job calling this every day at 9 AM

export async function GET() {
  try {
    await checkLowStockAndNotify();
    return NextResponse.json({
      success: true,
      message: "Low stock notifications sent successfully"
    });
  } catch (error: unknown) {
    console.error("Error checking low stock:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
