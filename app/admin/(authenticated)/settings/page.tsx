
import { SettingsPanel } from "@/components/admin/SettingsPanel";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-text-secondary">Manage your store configuration and team.</p>
      </div>

      <SettingsPanel />
    </div>
  );
}
