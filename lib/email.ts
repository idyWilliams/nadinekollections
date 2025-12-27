import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is missing. Email not sent.");
    return { success: false, error: "Missing API Key" };
  }

  try {
    const data = await resend.emails.send({
      from: 'NadineKollections <onboarding@resend.dev>', // Update this when domain is verified
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
};
