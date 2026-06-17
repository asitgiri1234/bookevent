import mongoose from "mongoose";
import Event from "../models/Event.js";
import Seat from "../models/Seat.js";
import Reservation from "../models/Reservation.js";
import { releaseExpiredSeats } from "../utils/releaseExpiredSeats.js";

// How long a reservation holds seats before it expires.
const RESERVATION_MINUTES = 10;

/**
 * POST /api/reserve   (protected)
 * Body: { eventId, seatNumbers: ["A1", "A2"] }
 *
 * Reserves the requested seats for RESERVATION_MINUTES. Double-booking is
 * prevented by grabbing each seat with an atomic conditional update:
 *
 *   findOneAndUpdate({ ..., status: "available" }, { status: "reserved" })
 *
 * Because a single-document update is atomic in MongoDB, only one concurrent
 * request can flip a given seat from available -> reserved; everyone else gets
 * null for that seat and is rejected. If we win some seats but then lose one,
 * we roll back the seats we grabbed so nothing is left half-reserved.
 */
export const reserveSeats = async (req, res, next) => {
  try {
    const { eventId, seatNumbers } = req.body;
    const userId = req.user.id;

    // --- Validate input ---
    if (!eventId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        message: "eventId and a non-empty seatNumbers array are required",
      });
    }
    // Drop accidental duplicates in the request.
    const requested = [...new Set(seatNumbers)];

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Free any expired holds first so abandoned seats are grabbable again.
    await releaseExpiredSeats(eventId);

    // Make sure every requested seat actually belongs to this event.
    const existing = await Seat.find({
      eventId,
      seatNumber: { $in: requested },
    }).select("seatNumber -_id");
    if (existing.length !== requested.length) {
      const found = existing.map((s) => s.seatNumber);
      const invalid = requested.filter((s) => !found.includes(s));
      return res.status(400).json({
        message: `Unknown seats for this event: ${invalid.join(", ")}`,
      });
    }

    // Pre-generate the reservation id so we can tag seats as we grab them.
    const reservationId = new mongoose.Types.ObjectId();
    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

    const grabbed = [];
    for (const seatNumber of requested) {
      const seat = await Seat.findOneAndUpdate(
        { eventId, seatNumber, status: "available" },
        {
          $set: {
            status: "reserved",
            reservationId,
            lockedBy: userId,
            reservedUntil: expiresAt,
          },
        },
        { new: true }
      );

      if (seat) {
        grabbed.push(seatNumber);
      } else {
        // Lost the race for this seat. Roll back only the seats WE grabbed
        // (matched by our reservationId, so we never free someone else's).
        await Seat.updateMany(
          { eventId, seatNumber: { $in: grabbed }, reservationId },
          {
            $set: {
              status: "available",
              reservationId: null,
              lockedBy: null,
              reservedUntil: null,
            },
          }
        );

        // Report exactly which of the requested seats are now unavailable.
        const unavailable = await Seat.find({
          eventId,
          seatNumber: { $in: requested },
          status: { $ne: "available" },
        }).select("seatNumber -_id");

        return res.status(409).json({
          message: "Some seats are no longer available",
          unavailableSeats: unavailable.map((s) => s.seatNumber),
        });
      }
    }

    // All seats secured — persist the reservation record.
    const reservation = await Reservation.create({
      _id: reservationId,
      userId,
      eventId,
      seatNumbers: requested,
      expiresAt,
    });

    return res.status(201).json({
      message: "Seats reserved",
      reservation,
      expiresAt,
      secondsLeft: RESERVATION_MINUTES * 60,
    });
  } catch (err) {
    next(err);
  }
};
