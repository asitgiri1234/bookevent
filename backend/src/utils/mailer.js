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
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log("Mailer: using Gmail SMTP");
        return nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
      }
      const testAccount = await nodemailer.createTestAccount();
      console.log("Mailer: using Ethereal test inbox", testAccount.user);
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
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
  const info = await transporter.sendMail({
    from: '"BookEvent" <no-reply@bookevent.app>',
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
