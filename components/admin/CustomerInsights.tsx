
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  total_spent: number;
  orders_count: number;
  last_order_date: string;
}

interface CustomerInsightsProps {
  customers: Customer[];
  totalCustomers: number;
}

export function CustomerInsights({ customers, totalCustomers }: CustomerInsightsProps) {
  // Mock Growth Data
  const growthData = [10, 15, 25, 30, 45, 55, 60, 75, 80, 95, 100, 120];
  const maxGrowth = Math.max(...growthData);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">Total Customers</p>
              <h3 className="text-2xl font-bold">{totalCustomers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10 text-success">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">New This Month</p>
              <h3 className="text-2xl font-bold">+12</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">Retention Rate</p>
              <h3 className="text-2xl font-bold">85%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <Card className="lg:col-span-2 border-none shadow-card">
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 pb-2">
              {growthData.map((value, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full group">
                  <div className="relative w-full bg-background rounded-t-lg overflow-hidden h-[250px] flex items-end">
                    <div
                      className="w-full bg-primary/80 group-hover:bg-primary transition-all duration-500 rounded-t-md"
                      style={{ height: `${(value / maxGrowth) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary font-medium">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demographics / Locations (Mock) */}
        <Card className="border-none shadow-card">
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { city: "Lagos", count: 45, percent: "45%" },
                { city: "Abuja", count: 30, percent: "30%" },
                { city: "Port Harcourt", count: 15, percent: "15%" },
                { city: "Ibadan", count: 10, percent: "10%" },
              ].map((loc) => (
                <div key={loc.city} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-2"><MapPin className="h-3 w-3 text-text-secondary" /> {loc.city}</span>
                    <span>{loc.count}</span>
                  </div>
                  <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: loc.percent }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card className="border-none shadow-card">
        <CardHeader>
          <CardTitle>Top Spenders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Customer</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Orders</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{customer.full_name}</td>
                    <td className="p-4 align-middle text-text-secondary">{customer.email}</td>
                    <td className="p-4 align-middle text-center">{customer.orders_count}</td>
                    <td className="p-4 align-middle text-right font-bold">{formatCurrency(customer.total_spent)}</td>
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
