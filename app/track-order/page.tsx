import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-md mx-auto text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Track Your Order</h1>
          <p className="text-text-secondary">
            Enter your order ID to see the current status of your shipment.
          </p>
        </div>

        <div className="bg-surface p-8 rounded-xl shadow-card border border-border-light space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <Input placeholder="Order ID (e.g., ORD-12345)" className="pl-10" />
          </div>
          <Button className="w-full btn-primary">Track Order</Button>
        </div>

        <div className="text-sm text-text-muted">
          <p>Having trouble?</p>
          <p>Contact us at <a href="mailto:support@nadinekollections.com" className="text-primary hover:underline">support@nadinekollections.com</a></p>
        </div>
      </div>
    </div>
  );
}
