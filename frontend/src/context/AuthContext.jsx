import { createContext, useContext, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

/**
 * Holds the logged-in user and the auth actions. The token and user are kept
 * in localStorage so a page refresh doesn't log the user out.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Save token + user after a successful register/login.
  const persist = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  // Register no longer logs in — it triggers a verification email and returns
  // { message, email, previewUrl } so the UI can send the user to verify.
  const register = async (name, email, password) => {
    const { data } = await client.post("/auth/register", {
      name,
      email,
      password,
    });
    return data;
  };

  // Verify the 6-digit code; on success the backend returns a token (auto-login).
  const verify = async (email, code) => {
    const { data } = await client.post("/auth/verify", { email, code });
    persist(data.token, data.user);
  };

  // Ask for a fresh code; returns { message, previewUrl }.
  const resend = async (email) => {
    const { data } = await client.post("/auth/resend", { email });
    return data;
  };

  const login = async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    persist(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeReservation"); // drop any held seats on logout
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, register, verify, resend, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook so components can call useAuth() instead of useContext.
export const useAuth = () => useContext(AuthContext);
