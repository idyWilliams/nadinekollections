"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCustomers = async () => {
      // Mock data
      setCustomers([
        { id: "1", name: "John Doe", email: "john@example.com", orders: 5, totalSpent: 125000, joined: "2024-01-15" },
        { id: "2", name: "Jane Smith", email: "jane@example.com", orders: 2, totalSpent: 45000, joined: "2024-02-01" },
        { id: "3", name: "Mike Johnson", email: "mike@example.com", orders: 1, totalSpent: 89000, joined: "2024-03-10" },
      ]);
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-text-secondary">View and manage your customer base.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-card border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-text-secondary font-medium border-b border-border-light">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{customer.name}</td>
                  <td className="px-6 py-4">{customer.email}</td>
                  <td className="px-6 py-4">{customer.orders}</td>
                  <td className="px-6 py-4">{customer.totalSpent.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</td>
                  <td className="px-6 py-4">{new Date(customer.joined).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" /> Email
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
