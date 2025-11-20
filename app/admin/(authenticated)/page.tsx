import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Package, ShoppingCart, TrendingUp, Users, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Mock stats
  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(1250000),
      change: "+12.5%",
      icon: DollarSign,
      trend: "up",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Orders",
      value: "156",
      change: "+8.2%",
      icon: ShoppingCart,
      trend: "up",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Products",
      value: "42",
      change: "-2.4%",
      icon: Package,
      trend: "down",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Total Customers",
      value: "89",
      change: "+15.3%",
      icon: Users,
      trend: "up",
      color: "text-green-600",
      bg: "bg-green-100",
    },
  ];

  // Mock recent orders
  const recentOrders = [
    { id: "ORD-001", customer: "John Doe", total: 45000, status: "Pending", date: "2024-03-15", items: 3 },
    { id: "ORD-002", customer: "Jane Smith", total: 12500, status: "Processing", date: "2024-03-14", items: 1 },
    { id: "ORD-003", customer: "Mike Johnson", total: 89000, status: "Shipped", date: "2024-03-14", items: 5 },
    { id: "ORD-004", customer: "Sarah Williams", total: 32000, status: "Delivered", date: "2024-03-13", items: 2 },
    { id: "ORD-005", customer: "Chris Evans", total: 15000, status: "Delivered", date: "2024-03-12", items: 1 },
  ];

  // Mock sales data for chart
  const salesData = [
    { month: "Jan", value: 45 },
    { month: "Feb", value: 52 },
    { month: "Mar", value: 38 },
    { month: "Apr", value: 65 },
    { month: "May", value: 48 },
    { month: "Jun", value: 72 },
  ];

  const maxSale = Math.max(...salesData.map(d => d.value));

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
                    stat.trend === "up" ? "text-success" : "text-error"
                  }`}>
                    {stat.change}
                    <TrendIcon className="h-4 w-4" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 border-none shadow-card">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-end justify-between gap-4 pt-8 pb-2">
              {salesData.map((data) => (
                <div key={data.month} className="flex flex-col items-center gap-2 w-full group">
                  <div className="relative w-full bg-background rounded-t-lg overflow-hidden h-[200px] flex items-end">
                    <div
                      className="w-full bg-primary/80 group-hover:bg-primary transition-all duration-500 rounded-t-md"
                      style={{ height: `${(data.value / maxSale) * 100}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface shadow-lg px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.value}k
                    </div>
                  </div>
                  <span className="text-sm text-text-secondary font-medium">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories / Quick Actions */}
        <Card className="border-none shadow-card">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: "Women's Fashion", sales: "45%", color: "bg-secondary" },
                { name: "Men's Collection", sales: "30%", color: "bg-primary" },
                { name: "Kids", sales: "15%", color: "bg-blue-400" },
                { name: "Accessories", sales: "10%", color: "bg-gray-400" },
              ].map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{cat.name}</span>
                    <span>{cat.sales}</span>
                  </div>
                  <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color}`} style={{ width: cat.sales }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-none shadow-card">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Order ID</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Customer</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Items</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Total</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{order.id}</td>
                    <td className="p-4 align-middle">{order.customer}</td>
                    <td className="p-4 align-middle">{order.date}</td>
                    <td className="p-4 align-middle">{order.items}</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                        order.status === "Delivered" ? "bg-success/10 text-success" :
                        order.status === "Shipped" ? "bg-blue-100 text-blue-800" :
                        order.status === "Processing" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
