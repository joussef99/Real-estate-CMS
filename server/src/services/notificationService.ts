import { Resend } from "resend";

let warnedMissingConfig = false;
let resendClient: Resend | null | undefined;

function getResendClient(): Resend | null {
  if (resendClient !== undefined) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  resendClient = apiKey ? new Resend(apiKey) : null;
  return resendClient;
}

export type NotifyAdminInput = {
  subject: string;
  html: string;
};

/**
 * Sends a notification email to the admin inbox (e.g. new lead, new resale
 * submission). Never throws — a failed/unconfigured email must never break
 * the request that triggered it, same defensive pattern as
 * mediaService.deleteImages.
 */
export async function notifyAdmin({ subject, html }: NotifyAdminInput): Promise<void> {
  const client = getResendClient();
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!client || !adminEmail) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      process.stderr.write(
        "[WARN] Admin email notifications are disabled — set RESEND_API_KEY and ADMIN_NOTIFICATION_EMAIL to enable them.\n",
      );
    }
    return;
  }

  try {
    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Livin Investments <onboarding@resend.dev>",
      to: adminEmail,
      subject,
      html,
    });
  } catch (err) {
    process.stderr.write(
      `[WARN] Failed to send admin notification email: ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}
