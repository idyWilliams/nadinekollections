
import { MarketingPanel } from "@/components/admin/MarketingPanel";

export default function AdminMarketingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing & SEO</h1>
          <p className="text-text-secondary">Manage promotions and monitor search performance.</p>
        </div>
      </div>

      <MarketingPanel />
    </div>
  );
}
