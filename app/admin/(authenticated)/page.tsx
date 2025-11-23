
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Package, ShoppingCart, TrendingUp, Users, ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { CategoryPieChart } from "@/components/admin/CategoryPieChart";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { LowStockWidget } from "@/components/admin/LowStockWidget";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Fetch Real Metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel data fetching
  const [
    { data: revenueData },
    { count: ordersTodayCount },
    { count: totalProductsCount },
    { count: lowStockCount },
    { count: totalCustomersCount },
    { data: lowStockItemsRaw }
  ] = await Promise.all([
    // Total Revenue (Paid orders)
    supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
    // Orders Today
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    // Active Products
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    // Low Stock Count (stock < 5)
    supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
    // Total Customers
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    // Low Stock Items (Top 5)
    supabase.from("products")
      .select("id, title, stock, primary_image")
      .lt("stock", 5)
      .limit(5)
  ]);

  const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

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
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      change: "+12.5%", // Placeholder trend
      icon: DollarSign,
      trend: "up",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Orders Today",
      value: ordersTodayCount?.toString() || "0",
      change: "+8.2%", // Placeholder trend
      icon: ShoppingCart,
      trend: "up",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Products",
      value: totalProductsCount?.toString() || "0",
      change: "-2.4%", // Placeholder trend
      icon: Package,
      trend: "down",
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

  // Mock sales data for chart
  const chartRevenueData = [
    { date: "Mon", value: 45000 },
    { date: "Tue", value: 52000 },
    { date: "Wed", value: 38000 },
    { date: "Thu", value: 65000 },
    { date: "Fri", value: 48000 },
    { date: "Sat", value: 72000 },
    { date: "Sun", value: 55000 },
  ];

  const categoryData = [
    { name: "Women", value: 45, color: "#D4AF37" }, // Gold
    { name: "Men", value: 30, color: "#000000" },   // Black
    { name: "Kids", value: 15, color: "#1E40AF" },  // Blue
    { name: "Accessories", value: 10, color: "#9CA3AF" }, // Gray
  ];

  // Mock recent orders
  const recentOrders = [
    { id: "ORD-001", customer: "John Doe", total: 45000, status: "Pending", date: "2024-03-15", items: 3 },
    { id: "ORD-002", customer: "Jane Smith", total: 12500, status: "Processing", date: "2024-03-14", items: 1 },
    { id: "ORD-003", customer: "Mike Johnson", total: 89000, status: "Shipped", date: "2024-03-14", items: 5 },
    { id: "ORD-004", customer: "Sarah Williams", total: 32000, status: "Delivered", date: "2024-03-13", items: 2 },
    { id: "ORD-005", customer: "Chris Evans", total: 15000, status: "Delivered", date: "2024-03-12", items: 1 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-text-secondary">Overview of your store's performance.</p>
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
                    stat.trend === "up" ? "text-success" : stat.trend === "down" ? "text-error" : "text-warning"
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
             <CategoryPieChart data={categoryData} />
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
