import { createClient } from "@/lib/supabase/server";

interface LogActivityParams {
  adminId: string;
  action: string;
  entityType?: string;
  entityName?: string;
  details?: string;
  path?: string;
}

export async function logAdminActivity(params: LogActivityParams) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("admin_activities")
      .insert({
        admin_id: params.adminId,
        action: params.action,
        entity_type: params.entityType,
        entity_name: params.entityName,
        details: params.details,
        path: params.path,
      });

    if (error) {
      console.error("Failed to log admin activity to DB:", error);
    }
  } catch (err) {
    console.error("Failed to log admin activity:", err);
  }
}
