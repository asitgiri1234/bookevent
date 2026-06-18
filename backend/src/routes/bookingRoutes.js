import express from "express";
import {
  createBooking,
  getMyBookings,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Booking requires a logged-in user.
router.post("/", protect, createBooking);
// List the current user's bookings.
router.get("/", protect, getMyBookings);

export default router;
