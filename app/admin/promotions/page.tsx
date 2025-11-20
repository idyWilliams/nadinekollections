import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Copy } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AdminPromotionsPage() {
  const supabase = await createClient();

  const { data: promotions } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="text-text-secondary">Manage discount codes and special offers.</p>
        </div>
        <Link href="/admin/promotions/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Promotion
          </Button>
        </Link>
      </div>

      {/* Promotions Table */}
      <div className="rounded-lg border border-border-light bg-surface">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Code</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Value</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Usage</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {promotions && promotions.length > 0 ? (
                promotions.map((promo) => (
                  <tr key={promo.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-mono font-bold">
                      {promo.code}
                    </td>
                    <td className="p-4 align-middle capitalize">
                      {promo.type.replace("_", " ")}
                    </td>
                    <td className="p-4 align-middle font-bold">
                      {promo.value}
                      {promo.type === "percentage_off" ? "%" : ""}
                    </td>
                    <td className="p-4 align-middle">
                      {promo.usage_count} / {promo.total_usage_limit || "∞"}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        promo.is_active ? "bg-success/10 text-success" : "bg-gray-100 text-gray-800"
                      }`}>
                        {promo.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-error hover:text-error">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">
                    No active promotions. Create one to boost sales!
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
