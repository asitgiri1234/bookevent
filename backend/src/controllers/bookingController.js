import Seat from "../models/Seat.js";
import Reservation from "../models/Reservation.js";

/**
 * POST /api/bookings   (protected)
 * Body: { reservationId }
 *
 * Confirms a reservation: flips its seats from reserved -> booked (permanent)
 * and removes the reservation. With no payment gateway, this endpoint stands in
 * for "payment succeeded".
 *
 * Guards:
 *  - the reservation must belong to the logged-in user
 *  - it must not be expired (expiresAt > now) — expired reservations are
 *    rejected and their seats released
 */
export const createBooking = async (req, res, next) => {
  try {
    const { reservationId } = req.body;
    const userId = req.user.id;

    if (!reservationId) {
      return res.status(400).json({ message: "reservationId is required" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      // Either never existed, or already booked/expired-and-cleaned-up.
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Only the owner (their uid) may confirm their own reservation.
    if (reservation.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "This reservation belongs to another user" });
    }

    // Reject expired reservations and free any seats they still hold.
    const expired =
      reservation.status !== "active" ||
      reservation.expiresAt.getTime() <= Date.now();
    if (expired) {
      await Seat.updateMany(
        { reservationId: reservation._id, status: "reserved" },
        {
          $set: {
            status: "available",
            reservationId: null,
            lockedBy: null,
            reservedUntil: null,
          },
        }
      );
      reservation.status = "expired";
      await reservation.save();
      return res
        .status(410)
        .json({ message: "Reservation has expired, please reserve again" });
    }

    // Atomically book the seats held by this reservation. Filtering on
    // status: "reserved" + reservationId means we only touch seats this
    // reservation actually holds.
    const result = await Seat.updateMany(
      {
        eventId: reservation.eventId,
        reservationId: reservation._id,
        status: "reserved",
      },
      { $set: { status: "booked", reservationId: null, reservedUntil: null } }
    );

    // Safety check: every seat in the reservation should have flipped.
    if (result.modifiedCount !== reservation.seatNumbers.length) {
      return res
        .status(409)
        .json({ message: "Could not book all seats, please reserve again" });
    }

    // Booking is final — remove the reservation per the spec.
    await Reservation.deleteOne({ _id: reservation._id });

    return res.status(201).json({
      message: "Booking confirmed",
      eventId: reservation.eventId,
      seatNumbers: reservation.seatNumbers,
    });
  } catch (err) {
    next(err);
  }
};
