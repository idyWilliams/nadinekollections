
import { createClient } from "@/lib/supabase/server";
import { BulkOrdersTable } from "@/components/admin/BulkOrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, created_at, total_amount, status, user_id, customer_name, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching orders:", error);
  } else {
    console.log("Fetched orders:", orders?.length, orders);
  }

  // Format orders for the table
  const formattedOrders = orders?.map(order => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fullName = (profile as any)?.full_name || order.customer_name || "Guest User";

    return {
      id: order.id,
      customer: fullName,
      total: order.total_amount || 0,
      status: order.status || "Pending",
      date: new Date(order.created_at).toLocaleDateString(),
      items: 1 // Placeholder as we're not fetching items count yet, or we could join with order_items count
    };
  }) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-text-secondary">Manage and fulfill customer orders.</p>
        </div>
      </div>

      <BulkOrdersTable orders={formattedOrders} />
    </div>
  );
}
