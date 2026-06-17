import mongoose from "mongoose";

/**
 * A temporary 10-minute hold on one or more seats for an event.
 * `expiresAt` is the source of truth for the booking expiry check:
 * a reservation past its expiresAt must not be allowed to book.
 */
const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    seatNumbers: { type: [String], required: true },
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: MongoDB housekeeps and deletes the reservation document once
// expiresAt has passed. Seat freeing is handled separately (and immediately)
// via the seat's reservedUntil, so we never depend on TTL timing for safety.
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Reservation", reservationSchema);
