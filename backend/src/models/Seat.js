import mongoose from "mongoose";

/**
 * A single seat for an event. This document is the source of truth for
 * availability. We flip its `status` with atomic conditional updates so two
 * users can never reserve/book the same seat (see the reserve controller).
 *
 * `reservedUntil` mirrors the reservation's expiry so we can release expired
 * holds with one atomic query, without joining back to the Reservation model.
 */
const seatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    seatNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["available", "reserved", "booked"],
      default: "available",
    },
    // Which reservation currently holds this seat (null when free/booked).
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },
    // Which user currently holds this seat (null when free).
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // When the temporary hold expires; used to auto-free abandoned seats.
    reservedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// A seat number must be unique within a given event.
seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

export default mongoose.model("Seat", seatSchema);
