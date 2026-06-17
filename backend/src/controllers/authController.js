import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

// Shape the user object we send back — never include the password hash.
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

/**
 * POST /api/auth/register
 * Create a new account and return a JWT.
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

    // Reject duplicate emails before hitting the unique-index error.
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Password is hashed automatically by the User model's pre-save hook.
    const user = await User.create({ name, email, password });

    res.status(201).json({
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Verify credentials and return a JWT.
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
    // Use the same generic message for both cases so we don't reveal which
    // emails are registered.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};
