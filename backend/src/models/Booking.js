import mongoose from "mongoose";

/**
 * A confirmed booking. Created when a reservation is successfully converted to
 * booked seats, so we can show a user their booking history ("My Bookings").
 */
const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    seatNumbers: { type: [String], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
