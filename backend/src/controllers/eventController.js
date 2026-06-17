import Event from "../models/Event.js";
import Seat from "../models/Seat.js";
import { releaseExpiredSeats } from "../utils/releaseExpiredSeats.js";

/**
 * GET /api/events
 * Return all events, soonest first.
 */
export const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ dateTime: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/events/:id
 * Return a single event plus its full seat grid. Expired holds are released
 * first so the statuses returned reflect true, current availability.
 */
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Free any abandoned holds before reporting seat statuses.
    await releaseExpiredSeats(event._id);

    // Sort by _id to preserve the natural grid order (A1, A2, ... B1, ...).
    const seats = await Seat.find({ eventId: event._id }).sort({ _id: 1 });

    res.json({ event, seats });
  } catch (err) {
    next(err);
  }
};
