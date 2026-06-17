import Seat from "../models/Seat.js";
import Reservation from "../models/Reservation.js";

/**
 * Free any seats whose temporary hold has expired, and mark the matching
 * reservations as expired. This is the "lazy cleanup" that keeps availability
 * accurate without depending on the TTL index's background timing.
 *
 * Called before we report or change availability (event detail, reserve).
 *
 * @param {mongoose.Types.ObjectId|string} [eventId] - limit to one event;
 *        omit to sweep all events.
 */
export const releaseExpiredSeats = async (eventId) => {
  const now = new Date();

  const seatFilter = { status: "reserved", reservedUntil: { $lt: now } };
  const reservationFilter = { status: "active", expiresAt: { $lt: now } };
  if (eventId) {
    seatFilter.eventId = eventId;
    reservationFilter.eventId = eventId;
  }

  // Flip expired holds back to available in one atomic bulk update.
  await Seat.updateMany(seatFilter, {
    $set: {
      status: "available",
      reservationId: null,
      lockedBy: null,
      reservedUntil: null,
    },
  });

  // Mark the corresponding reservations as expired (TTL will delete them later).
  await Reservation.updateMany(reservationFilter, {
    $set: { status: "expired" },
  });
};
