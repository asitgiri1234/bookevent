import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/mailer.js";

// Shape the user object we send back — never include the password or codes.
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  isVerified: user.isVerified,
});

// A 6-digit numeric code as a string, e.g. "048213".
const generateCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// Codes are valid for 10 minutes.
const CODE_TTL_MS = 10 * 60 * 1000;

/**
 * POST /api/auth/register
 * Create an UNVERIFIED account and email a verification code. No token is
 * returned yet — the user must verify before they can log in.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const code = generateCode();

    // Send the email first — if delivery fails we don't create the account,
    // avoiding an orphaned unverified user that can never receive a code.
    const previewUrl = await sendVerificationEmail(normalizedEmail, code);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password, // hashed by the model's pre-save hook
      isVerified: false,
      verificationCode: code,
      verificationCodeExpires: new Date(Date.now() + CODE_TTL_MS),
    });

    res.status(201).json({
      message: "Verification code sent to your email",
      email: user.email,
      // Convenience for the Ethereal test inbox so you can open the email.
      previewUrl,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify
 * Check the 6-digit code; on success mark the user verified and log them in.
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }
    if (user.verificationCodeExpires.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "Code expired. Please request a new one." });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Auto-login on successful verification.
    res.json({
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/resend
 * Generate and email a fresh verification code.
 */
export const resendCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const code = generateCode();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + CODE_TTL_MS);
    await user.save();

    const previewUrl = await sendVerificationEmail(user.email, code);

    res.json({ message: "A new code has been sent", previewUrl });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Verify credentials and return a JWT — but only for verified accounts.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Gate login on email verification.
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        needsVerification: true,
        email: user.email,
      });
    }

    res.json({
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};
