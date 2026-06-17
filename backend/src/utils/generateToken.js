import jwt from "jsonwebtoken";

/**
 * Sign a JWT carrying the user's id (their "uid"). This token is sent back to
 * the client on register/login and must be included on protected requests.
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
