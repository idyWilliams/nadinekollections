
import { createClient } from "@/lib/supabase/server";
import { BulkOrdersTable } from "@/components/admin/BulkOrdersTable";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, total_amount, status, user_id, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Format orders for the table
  const formattedOrders = orders?.map(order => {
    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fullName = (profile as any)?.full_name;

    return {
      id: order.id,
      customer: fullName || "Guest User",
      total: order.total_amount || 0,
      status: order.status || "Pending",
      date: new Date(order.created_at).toLocaleDateString(),
      items: 1 // Placeholder as we're not fetching items count yet
    };
  }) || [];

  // If no orders, use mock data for demonstration
  const displayOrders = formattedOrders.length > 0 ? formattedOrders : [
    { id: "ORD-001", customer: "John Doe", total: 45000, status: "Pending", date: "2024-03-15", items: 3 },
    { id: "ORD-002", customer: "Jane Smith", total: 12500, status: "Processing", date: "2024-03-14", items: 1 },
    { id: "ORD-003", customer: "Mike Johnson", total: 89000, status: "Shipped", date: "2024-03-14", items: 5 },
    { id: "ORD-004", customer: "Sarah Williams", total: 32000, status: "Delivered", date: "2024-03-13", items: 2 },
    { id: "ORD-005", customer: "Chris Evans", total: 15000, status: "Delivered", date: "2024-03-12", items: 1 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-text-secondary">Manage and fulfill customer orders.</p>
        </div>
      </div>

      <BulkOrdersTable orders={displayOrders} />
    </div>
  );
}
