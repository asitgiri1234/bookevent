import nodemailer from "nodemailer";
import { Resend } from "resend";

/**
 * Email sender with three modes, picked automatically from env vars:
 *
 *  1. Resend          — if RESEND_API_KEY is set (real, transactional email).
 *  2. Gmail SMTP      — else if EMAIL_USER + EMAIL_PASS are set (real email).
 *  3. Ethereal inbox  — otherwise: a fake test inbox that returns a preview URL
 *                       (no real delivery, zero setup).
 */

const SUBJECT = "Your BookEvent verification code";

// Shared email HTML body.
const buildHtml = (code) => `
  <div style="font-family: system-ui, sans-serif; max-width: 420px; margin: auto;">
    <h2>Verify your email</h2>
    <p>Use this code to finish creating your BookEvent account:</p>
    <p style="font-size: 30px; font-weight: 700; letter-spacing: 8px; background:#f4f4f5; padding: 14px; text-align:center; border-radius:8px;">
      ${code}
    </p>
    <p style="color:#6b7280;">This code expires in 10 minutes.</p>
  </div>`;

// --- Mode 0: Brevo (HTTP API) ---
// Free tier sends to ANY recipient once you verify a sender, and works on hosts
// that block SMTP (Render etc.). EMAIL_FROM should be your verified sender.
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const senderEmail =
  process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] || // "Name <a@b.com>" → a@b.com
  process.env.EMAIL_FROM ||
  process.env.EMAIL_USER ||
  "no-reply@bookevent.app";

// --- Mode 1: Resend ---
const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// On the free tier (no verified domain) Resend sends from this shared address.
// Set EMAIL_FROM to your own verified domain to send to any recipient.
const RESEND_FROM = process.env.EMAIL_FROM || "BookEvent <onboarding@resend.dev>";

// --- Modes 2/3: nodemailer transporter (Gmail or Ethereal) ---
let transporterPromise = null;
const getTransporter = () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      // Fail fast instead of hanging if SMTP ports are blocked (e.g. on many
      // cloud hosts like Render). Use Resend (HTTP API) in those environments.
      const timeouts = {
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      };

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log("Mailer: using Gmail SMTP");
        return nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          ...timeouts,
        });
      }
      const testAccount = await nodemailer.createTestAccount();
      console.log("Mailer: using Ethereal test inbox", testAccount.user);
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
        ...timeouts,
      });
    })();
  }
  return transporterPromise;
};

/**
 * Send a verification code email.
 * Returns an Ethereal preview URL when using the test inbox, otherwise null.
 */
export const sendVerificationEmail = async (to, code) => {
  // Mode 0: Brevo (HTTP API — not blocked by SMTP-restricted hosts, and can
  // email any recipient once a sender is verified).
  if (BREVO_API_KEY) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: "BookEvent" },
        to: [{ email: to }],
        subject: SUBJECT,
        htmlContent: buildHtml(code),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Brevo send failed (${res.status}): ${detail}`);
    }
    console.log(`Verification email sent to ${to} via Brevo`);
    return null;
  }

  // Mode 1: Resend (real email via API)
  if (resendClient) {
    const { data, error } = await resendClient.emails.send({
      from: RESEND_FROM,
      to: [to],
      subject: SUBJECT,
      html: buildHtml(code),
    });
    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message || "Failed to send verification email");
    }
    console.log(`Verification email sent to ${to} via Resend (id: ${data?.id})`);
    return null; // real email — no preview URL
  }

  // Modes 2/3: nodemailer (Gmail real, or Ethereal test)
  const transporter = await getTransporter();
  // Gmail forces the address to the authenticated account, so use it (with a
  // "BookEvent" display name). Falls back to a label for the Ethereal inbox.
  const from = process.env.EMAIL_USER
    ? `"BookEvent" <${process.env.EMAIL_USER}>`
    : '"BookEvent" <no-reply@bookevent.app>';
  const info = await transporter.sendMail({
    from,
    to,
    subject: SUBJECT,
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: buildHtml(code),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log(`Verification email preview for ${to}: ${previewUrl}`);
  }
  return previewUrl;
};
