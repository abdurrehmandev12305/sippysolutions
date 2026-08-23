import nodemailer, { type Transporter } from "nodemailer";

/**
 * Gmail SMTP delivery for the contact form.
 *
 * Credentials come from `.env.local` (never committed — see `.env.example`):
 *
 *   GMAIL_USER           the full Gmail address that sends the mail
 *   GMAIL_APP_PASSWORD   a 16-character App Password, NOT the account password
 *   CONTACT_TO           optional; defaults to GMAIL_USER
 *
 * Google blocks plain account passwords over SMTP, so the App Password is
 * mandatory: enable 2-Step Verification, then create one under
 * Google Account → Security → 2-Step Verification → App passwords.
 */

export type ContactMessage = {
  firstName: string;
  lastName: string;
  email: string;
  service: string;
  description: string;
};

/** Reused across requests — one pooled SMTP connection instead of one per submit. */
let cached: Transporter | null = null;

function getTransporter(): Transporter {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;

  if (!user || !password) {
    throw new Error(
      "Missing Gmail credentials: set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local",
    );
  }

  if (!cached) {
    cached = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        // Google displays App Passwords in four spaced groups; SMTP wants them joined.
        pass: password.replace(/\s+/g, ""),
      },
    });
  }

  return cached;
}

/**
 * Strips CR/LF before user input reaches a mail header. Without this a newline
 * in a name field could inject extra headers into the message.
 */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildText(message: ContactMessage): string {
  return [
    "New enquiry from the Sippy Solution contact form",
    "",
    `First Name:      ${message.firstName}`,
    `Last Name:       ${message.lastName}`,
    `Email:           ${message.email}`,
    `Choose Services: ${message.service}`,
    "",
    "Description",
    "-----------",
    message.description,
    "",
    `Received: ${new Date().toUTCString()}`,
  ].join("\n");
}

function buildHtml(message: ContactMessage): string {
  const row = (labelText: string, value: string) => `
      <tr>
        <td style="padding:8px 16px 8px 0;vertical-align:top;white-space:nowrap;color:#4a5675;font:600 12px/1.6 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em">${labelText}</td>
        <td style="padding:8px 0;vertical-align:top;color:#0d121f;font:400 15px/1.6 system-ui,sans-serif">${escapeHtml(value)}</td>
      </tr>`;

  return `<div style="background:#f4f6fb;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e6eaf4;border-radius:12px;overflow:hidden">
    <div style="background:#4f46e5;padding:20px 24px">
      <h1 style="margin:0;color:#fff;font:700 18px/1.4 system-ui,sans-serif">New Contact Form Enquiry</h1>
      <p style="margin:4px 0 0;color:#c7d2fe;font:400 13px/1.5 system-ui,sans-serif">sippysolution.com</p>
    </div>
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse">
        ${row("First Name", message.firstName)}
        ${row("Last Name", message.lastName)}
        ${row("Email", message.email)}
        ${row("Choose Services", message.service)}
      </table>
      <p style="margin:24px 0 8px;color:#4a5675;font:600 12px/1.6 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em">Description</p>
      <div style="white-space:pre-wrap;color:#0d121f;font:400 15px/1.7 system-ui,sans-serif;background:#f4f6fb;border-radius:8px;padding:16px">${escapeHtml(
        message.description,
      )}</div>
    </div>
    <div style="border-top:1px solid #e6eaf4;padding:16px 24px;color:#6b789a;font:400 12px/1.6 system-ui,sans-serif">
      Received ${escapeHtml(new Date().toUTCString())} · Reply directly to this email to reach ${escapeHtml(
        message.email,
      )}
    </div>
  </div>
</div>`;
}

/**
 * Sends one enquiry. Throws on any failure so the caller can answer with an
 * error instead of a false success.
 */
export async function sendContactEmail(message: ContactMessage): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.GMAIL_USER as string;
  const to = process.env.CONTACT_TO?.trim() || from;
  const name = headerSafe(`${message.firstName} ${message.lastName}`);

  await transporter.sendMail({
    // Gmail rewrites `from` to the authenticated account, so send as it.
    from: `"Sippy Solution Website" <${from}>`,
    to,
    // Replying in Gmail then goes straight back to the visitor.
    replyTo: `"${name}" <${message.email}>`,
    subject: headerSafe(`New enquiry: ${message.service} — ${name}`),
    text: buildText(message),
    html: buildHtml(message),
  });
}
