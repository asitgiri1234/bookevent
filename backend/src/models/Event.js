import mongoose from "mongoose";

/**
 * An event that users can book seats for. Seats are stored as separate
 * Seat documents (one per seat) and linked back to an event via eventId.
 */
const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dateTime: { type: Date, required: true },
    venue: { type: String, required: true, trim: true },
    totalSeats: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: "" },
    category: { type: String, default: "Event" },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
