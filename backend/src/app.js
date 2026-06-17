import express from "express";
import cors from "cors";

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// Health check — confirms the server is up
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "BookEvent API is running" });
});

// Routes will be mounted here in later steps:
// app.use("/api/auth", authRoutes);
// app.use("/api/events", eventRoutes);
// app.use("/api/reserve", reserveRoutes);
// app.use("/api/bookings", bookingRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
