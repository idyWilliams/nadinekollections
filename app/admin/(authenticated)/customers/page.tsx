
import { createClient } from "@/lib/supabase/server";
import { CustomersTable } from "@/components/admin/CustomersTable";

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  // 1. Fetch all customers
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  // 2. Fetch all orders (for aggregation)
  // In a production app with many orders, we would use RPC or separate analytics table
  const { data: orders } = await supabase
    .from("orders")
    .select("user_id, total_amount, created_at, shipping_address, billing_address")
    .not("user_id", "is", null);

  // 3. Aggregate Data
  const customers = profiles?.map(profile => {
    const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
    const totalSpent = userOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const lastOrder = userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    // Parse address if it's a string (legacy/bug) or object
    let billingInfo = null;
    if (lastOrder?.shipping_address) {
        const addr = typeof lastOrder.shipping_address === 'string'
            ? JSON.parse(lastOrder.shipping_address)
            : lastOrder.shipping_address;

        billingInfo = {
            address: addr.line1 || addr.address || "N/A",
            city: addr.city || "N/A",
            state: addr.state || "N/A",
            zip: addr.zip || addr.zipCode || "N/A",
            country: addr.country || "Nigeria"
        };
    }

    return {
      id: profile.id,
      full_name: profile.full_name || "Unknown",
      email: profile.email || "No Email",
      phone: profile.phone,
      total_orders: userOrders.length,
      total_spent: totalSpent,
      wishlist_count: 0, // Wishlist is client-side only for now
      last_order_date: lastOrder ? new Date(lastOrder.created_at).toLocaleDateString() : undefined,
      billing_info: billingInfo || undefined
    };
  }) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-text-secondary">Analyze customer behavior and demographics.</p>
        </div>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
