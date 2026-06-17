import express from "express";
import { createBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Booking requires a logged-in user.
router.post("/", protect, createBooking);

export default router;
