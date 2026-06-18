import nodemailer from "nodemailer";

/**
 * Email sender. By default it uses an Ethereal test account (a fake SMTP inbox
 * that nodemailer creates on the fly) — no credentials needed. The email isn't
 * really delivered, but nodemailer gives us a preview URL we log to the console
 * so you can open and read it in the browser.
 *
 * To send REAL emails instead, set EMAIL_USER + EMAIL_PASS (a Gmail address and
 * an app password) in .env and this will use Gmail SMTP automatically.
 */

// Build the transporter once and reuse it (creating a test account is slow).
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

      // No real creds → spin up a disposable Ethereal test inbox.
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
 * Send a verification code email. Returns the Ethereal preview URL (or null if
 * sending through a real provider).
 */
export const sendVerificationEmail = async (to, code) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"BookEvent" <no-reply@bookevent.app>',
    to,
    subject: "Your BookEvent verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 420px; margin: auto;">
        <h2>Verify your email</h2>
        <p>Use this code to finish creating your BookEvent account:</p>
        <p style="font-size: 30px; font-weight: 700; letter-spacing: 8px; background:#f4f4f5; padding: 14px; text-align:center; border-radius:8px;">
          ${code}
        </p>
        <p style="color:#6b7280;">This code expires in 10 minutes.</p>
      </div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log(`Verification email preview for ${to}: ${previewUrl}`);
  }
  return previewUrl;
};
