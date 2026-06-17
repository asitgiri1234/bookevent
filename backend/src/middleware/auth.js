import jwt from "jsonwebtoken";

/**
 * Auth guard for protected routes. Expects an "Authorization: Bearer <token>"
 * header, verifies the JWT, and attaches the user's id to req.user so
 * controllers know who is acting (their uid).
 */
export const protect = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};
