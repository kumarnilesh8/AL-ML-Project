import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

let transport: Transporter | null = null;

/**
 * Sends an email. Locally SMTP_URL points at the test mailbox (http://127.0.0.1:54324).
 * Without SMTP_URL the message is printed to the terminal instead, so nothing is lost while testing.
 */
export async function sendEmail(message: EmailMessage): Promise<{ delivered: boolean }> {
  const url = process.env.SMTP_URL;
  const from = process.env.EMAIL_FROM ?? 'Club sessions <no-reply@club-sessions.local>';
  if (!url) {
    console.info(`[email not sent: SMTP_URL not set] To: ${message.to} | ${message.subject}\n${message.text}`);
    return { delivered: false };
  }
  transport ??= nodemailer.createTransport(url);
  await transport.sendMail({ from, ...message });
  return { delivered: true };
}
