import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Package, ShoppingCart, ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { CategoryPieChart } from "@/components/admin/CategoryPieChart";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { LowStockWidget } from "@/components/admin/LowStockWidget";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Fetch Real Metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Parallel data fetching
  const [
    { data: revenueData },
    { count: ordersTodayCount },
    { count: totalProductsCount },
    { count: lowStockCount },
    { data: lowStockItemsRaw },
    { data: recentOrdersRaw },
    { data: orderItemsRaw }
  ] = await Promise.all([
    // Total Revenue (Paid orders) & Revenue History (Last 7 Days)
    supabase.from("orders").select("total_amount, created_at").eq("payment_status", "paid").gte("created_at", sevenDaysAgo.toISOString()),
    // Orders Today
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    // Active Products
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    // Low Stock Count (stock < 5)
    supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
    // Low Stock Items (Top 5)
    supabase.from("products")
      .select("id, title, stock, primary_image")
      .lt("stock", 5)
      .limit(5),
    // Recent Orders (Last 10)
    supabase.from("orders")
      .select("*, profiles(full_name), order_items(count)")
      .order("created_at", { ascending: false })
      .limit(10),
    // Category Sales Data (All time or last 30 days? Let's do all time for now to ensure data)
    supabase.from("order_items").select("quantity, products(category)")
  ]);

  // --- Process Revenue Data ---
  const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  // Group revenue by date for the last 7 days
  const revenueByDate = new Map<string, number>();
  // Initialize last 7 days with 0
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue
    revenueByDate.set(dateStr, 0);
  }

  revenueData?.forEach(order => {
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    if (revenueByDate.has(dateStr)) {
      revenueByDate.set(dateStr, (revenueByDate.get(dateStr) || 0) + (order.total_amount || 0));
    }
  });

  // Convert map to array and reverse to show oldest to newest
  const chartRevenueData = Array.from(revenueByDate.entries())
    .map(([date, value]) => ({ date, value }))
    .reverse();


  // --- Process Category Data ---
  const categorySales = new Map<string, number>();
  orderItemsRaw?.forEach((item: any) => {
    const categories = item.products?.category || [];
    // If product has multiple categories, attribute sale to all of them (or just first? Let's do all)
    categories.forEach((cat: string) => {
      categorySales.set(cat, (categorySales.get(cat) || 0) + (item.quantity || 0));
    });
  });

  const categoryColors = ["#D4AF37", "#000000", "#1E40AF", "#9CA3AF", "#10B981", "#EF4444"];
  const categoryData = Array.from(categorySales.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: categoryColors[index % categoryColors.length]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 categories


  // --- Process Recent Orders ---
  const recentOrders = recentOrdersRaw?.map(order => ({
    id: order.id.slice(0, 8).toUpperCase(), // Short ID
    customer: order.customer_name || order.profiles?.full_name || "Guest",
    total: order.total_amount,
    status: order.status,
    date: new Date(order.created_at).toLocaleDateString(),
    items: order.order_items?.[0]?.count || 0
  })) || [];


  // Map low stock items to match widget interface
  const lowStockItems = lowStockItemsRaw?.map(item => ({
    id: item.id,
    title: item.title,
    stock: item.stock,
    image: item.primary_image || '/placeholder.png'
  })) || [];

  // Stats Array
  const stats = [
    {
      title: "Total Revenue (7d)",
      value: formatCurrency(totalRevenue),
      change: "Last 7 days",
      icon: DollarSign,
      trend: "neutral",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Orders Today",
      value: ordersTodayCount?.toString() || "0",
      change: "Daily count",
      icon: ShoppingCart,
      trend: "neutral",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Products",
      value: totalProductsCount?.toString() || "0",
      change: "In catalog",
      icon: Package,
      trend: "neutral",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount?.toString() || "0",
      change: "Action Needed",
      icon: AlertTriangle,
      trend: "neutral",
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-text-secondary">Overview of your store&apos;s performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={stat.title} className="card-hover border-none shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-success" : stat.trend === "down" ? "text-error" : "text-text-muted"
                  }`}>
                    {stat.change}
                    {stat.trend !== "neutral" && <TrendIcon className="h-4 w-4" />}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-text-secondary">{stat.title}</h3>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart (2/3 width) */}
        <Card className="lg:col-span-2 border-none shadow-card">
          <CardHeader>
            <CardTitle>Revenue Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartRevenueData} />
          </CardContent>
        </Card>

        {/* Category Chart (1/3 width) */}
        <Card className="border-none shadow-card">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
             {categoryData.length > 0 ? (
               <CategoryPieChart data={categoryData} />
             ) : (
               <div className="h-[300px] flex items-center justify-center text-text-muted">
                 No sales data yet
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Low Stock & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Low Stock Widget (1/3 width) */}
        <div className="lg:col-span-1">
          <LowStockWidget items={lowStockItems} />
        </div>

        {/* Recent Orders Table (2/3 width) */}
        <Card className="lg:col-span-2 border-none shadow-card">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrdersTable orders={recentOrders} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
