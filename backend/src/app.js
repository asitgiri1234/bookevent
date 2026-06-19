import express from "express";
import cors from "cors";
import eventRoutes from "./routes/eventRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reserveRoutes from "./routes/reserveRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Core middleware
// Optionally lock CORS to your deployed frontend via CLIENT_URL; otherwise
// allow all origins (fine here since auth uses Bearer tokens, not cookies).
app.use(cors(process.env.CLIENT_URL ? { origin: process.env.CLIENT_URL } : {}));
app.use(express.json());

// Health check — confirms the server is up
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "BookEvent API is running" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/reserve", reserveRoutes);
app.use("/api/bookings", bookingRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Central error handler — must be registered last.
app.use(errorHandler);

export default app;
