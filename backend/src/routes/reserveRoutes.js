import express from "express";
import { reserveSeats } from "../controllers/reserveController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Reserving requires a logged-in user (their uid comes from the token).
router.post("/", protect, reserveSeats);

export default router;
