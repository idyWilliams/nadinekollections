import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Package, ShoppingCart, ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle, MapPin } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { CategoryPieChart } from "@/components/admin/CategoryPieChart";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { LowStockWidget } from "@/components/admin/LowStockWidget";
import { OrderMap } from "@/components/admin/OrderMap";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Fetch Stats Data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // Parallelize queries for performance
  const [
    { count: ordersTodayCount },
    { count: totalProductsCount },
    { count: lowStockProductsCount },
    { count: lowStockVariantsCount },
    { data: revenueData },
    { data: recentOrdersData },
    { data: categoryDataRaw },
    { data: mapDataRaw }
  ] = await Promise.all([
    // Orders Today
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", todayISO),

    // Active Products
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),

    // Low Stock Products (threshold < 10)
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true).lt("stock", 10),

    // Low Stock Variants (threshold < 10)
    supabase.from("product_variants").select("*", { count: "exact", head: true }).lt("inventory_count", 10),

    // Revenue Data (Last 7 Days) - Fetching paid orders
    supabase
      .from("orders")
      .select("total_amount, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", sevenDaysAgoISO),

    // Recent Orders
    supabase
      .from("orders")
      .select("id, created_at, total_amount, status, user_id, customer_name") // Removed profiles(full_name)
      .order("created_at", { ascending: false })
      .limit(5),

    // Category Data (using products table)
    supabase.from("products").select("category"),

    // Map Data (using shipping_address from orders)
    supabase.from("orders").select("shipping_address")
  ]);

  // Process Revenue Data
  const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  // Process Chart Data (Daily Revenue)
  const chartRevenueData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // Go back 6 days to today
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dailyTotal = revenueData
      ?.filter(order => order.created_at.startsWith(dateStr))
      .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    return { date: dayName, value: dailyTotal };
  });

  // Process Category Data
  const categoryCounts: Record<string, number> = {};
  categoryDataRaw?.forEach(product => {
    if (Array.isArray(product.category)) {
      product.category.forEach((cat: string) => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    }
  });

  const categoryData = Object.entries(categoryCounts).map(([name, value], index) => {
    const colors = ["#D4AF37", "#000000", "#1E40AF", "#9CA3AF", "#10B981", "#F59E0B"];
    return { name, value, color: colors[index % colors.length] };
  });

  // Process Recent Orders
  const recentOrders = recentOrdersData?.map(order => {
    // const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
    // const fullName = profile?.full_name || order.customer_name || "Guest User";
    const fullName = order.customer_name || "Guest/Anon";

    return {
      id: order.id,
      customer: fullName,
      total: order.total_amount || 0,
      status: order.status || "Pending",
      date: new Date(order.created_at).toLocaleDateString(),
      items: 1 // Placeholder
    };
  }) || [];

  // Process Map Data (State distribution)
  const stateCounts: Record<string, number> = {};
  mapDataRaw?.forEach(order => {

    const state = order.shipping_address?.state;
    if (state) {
      // Simple normalization
      const normalizedState = state.trim().replace(/ state$/i, "");
      stateCounts[normalizedState] = (stateCounts[normalizedState] || 0) + 1;
    }
  });

  const mapData = Object.entries(stateCounts)
    .map(([state, value]) => ({ state, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 states

  // Fetch Low Stock Details (Both Products and Variants)
  const [
    { data: lpData },
    { data: lvData }
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, stock, primary_image")
      .eq("is_active", true)
      .lt("stock", 10)
      .limit(5),
    supabase
      .from("product_variants")
      .select("id, name, inventory_count, products(title, primary_image)")
      .lt("inventory_count", 10)
      .limit(5)
  ]);

  const lowStockItems = [
    ...(lpData?.map(item => ({
      id: item.id,
      title: item.title,
      stock: item.stock,
      image: item.primary_image || "/placeholder.png"
    })) || []),
    ...(lvData?.map(item => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        id: item.id,
        title: `${product?.title} - ${item.name}`,
        stock: item.inventory_count,
        image: product?.primary_image || "/placeholder.png"
      };
    }) || [])
  ].sort((a, b) => a.stock - b.stock).slice(0, 5);

  const lowStockTotal = (lowStockProductsCount || 0) + (lowStockVariantsCount || 0);


  // Stats Array
  const stats = [
    {
      title: "Total Revenue (7d)",
      value: formatCurrency(totalRevenue, "NGN"),
      change: "Last 7 days",
      icon: DollarSign,
      trend: "up", // Dynamic trend calculation could be added here
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Orders Today",
      value: (ordersTodayCount || 0).toString(),
      change: "Daily count",
      icon: ShoppingCart,
      trend: "neutral",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Products",
      value: (totalProductsCount || 0).toString(),
      change: "In catalog",
      icon: Package,
      trend: "neutral",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockTotal.toString(),
      change: "Action Needed",
      icon: AlertTriangle,
      trend: lowStockTotal > 0 ? "down" : "neutral",
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
            <Card key={stat.title} className="card-hover border shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === "up" ? "text-success" : stat.trend === "down" ? "text-error" : "text-text-muted"
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
        <Card className="lg:col-span-2 border shadow-card">
          <CardHeader>
            <CardTitle>Revenue Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartRevenueData} />
          </CardContent>
        </Card>

        {/* Category Chart (1/3 width) */}
        <Card className="border shadow-card">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={categoryData} />
          </CardContent>
        </Card>
      </div>

      {/* Map & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Map (2/3 width) */}
        <Card className="lg:col-span-2 border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Customer Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderMap data={mapData} />
          </CardContent>
        </Card>

        {/* Low Stock Widget (1/3 width) */}
        <div className="lg:col-span-1">
          <LowStockWidget items={lowStockItems} />
        </div>
      </div>

      {/* Recent Orders Table (Full width) */}
      <Card className="border shadow-card">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrdersTable orders={recentOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
