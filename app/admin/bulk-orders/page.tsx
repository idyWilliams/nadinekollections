import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminBulkOrdersPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("bulk_orders")
    .select("*")
    .order("created_at", { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge variant="success">Approved</Badge>;
      case "quoted": return <Badge variant="secondary">Quoted</Badge>;
      case "converted": return <Badge variant="success">Converted</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="warning">New</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Order Requests</h1>
          <p className="text-text-secondary">Manage large quantity requests from customers.</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input placeholder="Search requests..." className="pl-10 bg-surface" />
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border border-border-light bg-surface">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Request #</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Customer</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Organization</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {requests && requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{req.request_number}</td>
                    <td className="p-4 align-middle">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{req.customer_info?.name}</span>
                        <span className="text-xs text-text-muted">{req.customer_info?.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {req.customer_info?.organization || "-"}
                    </td>
                    <td className="p-4 align-middle">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Mail className="h-4 w-4" />
                          Quote
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">
                    No bulk order requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
