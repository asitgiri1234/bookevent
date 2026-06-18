import { Link, useLocation } from "react-router-dom";
import { useReservation } from "../context/ReservationContext";
import CountdownTimer from "./CountdownTimer";

/**
 * A sticky notification shown on every page while the user is holding seats.
 * Clicking it jumps to the event so they can complete the booking. It hides
 * itself on that event's own page, where the in-page timer already shows.
 */
export default function ReservationBanner() {
  const { reservation, clearReservation } = useReservation();
  const location = useLocation();

  if (!reservation) return null;
  if (location.pathname === `/events/${reservation.eventId}`) return null;

  const count = reservation.seatNumbers.length;

  return (
    <Link to={`/events/${reservation.eventId}`} className="reservation-banner">
      <span className="rb-pulse" />
      <span className="rb-text">
        Holding{" "}
        <strong>
          {count} seat{count > 1 ? "s" : ""}
        </strong>{" "}
        for {reservation.eventName} — finish before time runs out
      </span>
      <span className="rb-timer">
        <CountdownTimer
          expiresAt={reservation.expiresAt}
          onExpire={clearReservation}
        />
      </span>
      <span className="rb-cta">Complete booking →</span>
    </Link>
  );
}
