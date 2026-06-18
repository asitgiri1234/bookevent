import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";
import SeatGrid from "../components/SeatGrid";
import CountdownTimer from "../components/CountdownTimer";
import { formatDate } from "../utils/format";

export default function EventDetail() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]); // selected seatNumbers
  const [loading, setLoading] = useState(true);

  // Flow state: "select" → "reserved" → "booked"
  const [phase, setPhase] = useState("select");
  const [reservation, setReservation] = useState(null); // {reservationId, seatNumbers, expiresAt}
  const [bookedSeats, setBookedSeats] = useState([]);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [reserving, setReserving] = useState(false);
  const [booking, setBooking] = useState(false);

  // Refetch the current seat statuses for this event.
  const refetchSeats = useCallback(async () => {
    const { data } = await client.get(`/events/${id}`);
    setSeats(data.seats);
  }, [id]);

  // Initial load.
  useEffect(() => {
    let active = true;
    client
      .get(`/events/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setEvent(data.event);
        setSeats(data.seats);
      })
      .catch(
        (err) =>
          active &&
          setError(err.response?.data?.message || "Failed to load event")
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  // Toggle a seat in/out of the selection (only while choosing, only available).
  const toggleSeat = (seat) => {
    if (phase !== "select" || seat.status !== "available") return;
    setError("");
    setInfo("");
    setSelected((prev) =>
      prev.includes(seat.seatNumber)
        ? prev.filter((s) => s !== seat.seatNumber)
        : [...prev, seat.seatNumber]
    );
  };

  // Step 1: reserve the selected seats.
  const handleReserve = async () => {
    setError("");
    setInfo("");
    setReserving(true);
    try {
      const { data } = await client.post("/reserve", {
        eventId: id,
        seatNumbers: selected,
      });
      setReservation({
        reservationId: data.reservation._id,
        seatNumbers: data.reservation.seatNumbers,
        expiresAt: data.expiresAt,
      });
      setPhase("reserved");
      setSelected([]);
      await refetchSeats();
    } catch (err) {
      const res = err.response;
      if (res?.status === 409) {
        // A seat became unavailable between selection and reserve.
        const taken = res.data.unavailableSeats || [];
        setError(
          `These seats were just taken: ${taken.join(", ")}. Please choose again.`
        );
        setSelected((prev) => prev.filter((s) => !taken.includes(s)));
        await refetchSeats();
      } else {
        setError(res?.data?.message || "Could not reserve seats. Try again.");
      }
    } finally {
      setReserving(false);
    }
  };

  // When the 10-minute hold runs out before booking.
  const handleExpire = useCallback(() => {
    setReservation(null);
    setPhase("select");
    setSelected([]);
    setInfo("Your reservation expired. Please select seats again.");
    refetchSeats();
  }, [refetchSeats]);

  // Step 2: confirm the booking.
  const handleBooking = async () => {
    setError("");
    setBooking(true);
    try {
      const { data } = await client.post("/bookings", {
        reservationId: reservation.reservationId,
      });
      setBookedSeats(data.seatNumbers);
      setReservation(null);
      setPhase("booked");
      await refetchSeats();
    } catch (err) {
      const res = err.response;
      if (res?.status === 410) {
        handleExpire();
        setError("Your reservation expired before booking. Please try again.");
      } else {
        setError(res?.data?.message || "Booking failed. Please try again.");
      }
    } finally {
      setBooking(false);
    }
  };

  // Book again after a successful booking.
  const reset = () => {
    setBookedSeats([]);
    setSelected([]);
    setError("");
    setInfo("");
    setPhase("select");
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (error && !event) return <div className="alert alert-error">{error}</div>;
  if (!event) return null;

  return (
    <div>
      <Link to="/" className="back-link">
        ← Back to events
      </Link>

      <h1>{event.name}</h1>
      <p className="muted event-meta">
        {formatDate(event.dateTime)} · {event.venue}
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-info">{info}</div>}

      <SeatGrid
        seats={seats}
        selected={selected}
        mine={reservation ? reservation.seatNumbers : []}
        onToggle={toggleSeat}
      />

      {/* ---- Bottom action panel changes with the flow phase ---- */}
      {phase === "select" && (
        <div className="action-bar">
          {selected.length > 0 ? (
            <span>
              Selected <strong>{selected.join(", ")}</strong> ({selected.length})
            </span>
          ) : (
            <span className="muted">Select one or more available seats</span>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={selected.length === 0 || reserving}
            onClick={handleReserve}
          >
            {reserving ? "Reserving…" : `Reserve${selected.length ? ` (${selected.length})` : ""}`}
          </button>
        </div>
      )}

      {phase === "reserved" && reservation && (
        <div className="action-bar reserved-bar">
          <div>
            <div className="reserved-seats">
              Holding <strong>{reservation.seatNumbers.join(", ")}</strong>
            </div>
            <div className="muted reserved-hint">
              Confirm before the timer runs out or the seats are released.
            </div>
          </div>
          <div className="reserved-actions">
            <span className="timer-wrap">
              <span className="timer-label">Time left</span>
              <CountdownTimer
                expiresAt={reservation.expiresAt}
                onExpire={handleExpire}
              />
            </span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={booking}
              onClick={handleBooking}
            >
              {booking ? "Confirming…" : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}

      {phase === "booked" && (
        <div className="success-panel">
          <div className="success-check">✓</div>
          <h2>Booking confirmed</h2>
          <p className="muted">
            Your seats <strong>{bookedSeats.join(", ")}</strong> are booked for{" "}
            {event.name}.
          </p>
          <div className="success-actions">
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Book more seats
            </button>
            <Link to="/" className="btn btn-primary">
              Back to events
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
