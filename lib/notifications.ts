import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
  userId?: string; // If null, it's a system-wide notification (for admins)
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  sendEmailTo?: string; // If provided, sends an email too
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = await createClient();

  // 1. Insert into DB
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type || 'info',
    title: params.title,
    message: params.message,
    link: params.link,
    metadata: params.metadata,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }

  // 2. Send Email if requested
  if (params.sendEmailTo) {
    await sendEmail({
      to: params.sendEmailTo,
      subject: params.title,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>${params.title}</h2>
          <p>${params.message}</p>
          ${params.link ? `<p><a href="${process.env.NEXT_PUBLIC_SITE_URL}${params.link}" style="color: #D4AF37;">View Details</a></p>` : ''}
          <hr />
          <p style="font-size: 12px; color: #666;">NadineKollections</p>
        </div>
      `
    });
  }
}
