import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Package, ShoppingCart, ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle, MapPin } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { CategoryPieChart } from "@/components/admin/CategoryPieChart";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { LowStockWidget } from "@/components/admin/LowStockWidget";
import { OrderMap } from "@/components/admin/OrderMap";

export default async function AdminDashboard() {
  // Mock Data for Dashboard
  const totalRevenue = 4500000;
  const ordersTodayCount = 25;
  const totalProductsCount = 150;
  const lowStockCount = 8;

  const chartRevenueData = [
    { date: "Mon", value: 150000 },
    { date: "Tue", value: 230000 },
    { date: "Wed", value: 180000 },
    { date: "Thu", value: 320000 },
    { date: "Fri", value: 290000 },
    { date: "Sat", value: 450000 },
    { date: "Sun", value: 380000 },
  ];

  const categoryData = [
    { name: "Women", value: 45, color: "#D4AF37" },
    { name: "Men", value: 30, color: "#000000" },
    { name: "Kids", value: 15, color: "#1E40AF" },
    { name: "Accessories", value: 10, color: "#9CA3AF" },
  ];

  const recentOrders = [
    { id: "ORD-7829", customer: "Amara Okeke", total: 45000, status: "Pending", date: "2024-03-15", items: 3 },
    { id: "ORD-7828", customer: "John Doe", total: 12500, status: "Processing", date: "2024-03-14", items: 1 },
    { id: "ORD-7827", customer: "Chioma Adebayo", total: 89000, status: "Shipped", date: "2024-03-14", items: 5 },
    { id: "ORD-7826", customer: "Sarah Williams", total: 32000, status: "Delivered", date: "2024-03-13", items: 2 },
    { id: "ORD-7825", customer: "Chris Evans", total: 15000, status: "Delivered", date: "2024-03-12", items: 1 },
  ];

  const lowStockItems = [
    { id: "1", title: "Gold Plated Necklace", stock: 2, image: "/products/accessories-1.png" },
    { id: "2", title: "Silk Scarf", stock: 4, image: "/products/accessories-2.png" },
    { id: "3", title: "Leather Belt", stock: 3, image: "/products/men-1.png" },
  ];

  const mapData = [
    { state: "Lagos", value: 120 },
    { state: "Abuja", value: 80 },
    { state: "Rivers", value: 45 },
    { state: "Kano", value: 30 },
    { state: "Oyo", value: 25 },
    { state: "Enugu", value: 20 },
    { state: "Kaduna", value: 15 },
  ];

  // Stats Array
  const stats = [
    {
      title: "Total Revenue (7d)",
      value: formatCurrency(totalRevenue, "NGN"),
      change: "Last 7 days",
      icon: DollarSign,
      trend: "up",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Orders Today",
      value: ordersTodayCount.toString(),
      change: "Daily count",
      icon: ShoppingCart,
      trend: "up",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Products",
      value: totalProductsCount.toString(),
      change: "In catalog",
      icon: Package,
      trend: "neutral",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount.toString(),
      change: "Action Needed",
      icon: AlertTriangle,
      trend: "down",
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
