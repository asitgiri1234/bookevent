import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";
import SeatGrid from "../components/SeatGrid";
import { formatDate } from "../utils/format";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]); // selected seatNumbers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Toggle a seat in/out of the selection. Only available seats are selectable.
  const toggleSeat = (seat) => {
    if (seat.status !== "available") return;
    setSelected((prev) =>
      prev.includes(seat.seatNumber)
        ? prev.filter((s) => s !== seat.seatNumber)
        : [...prev, seat.seatNumber]
    );
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!event) return null;

  return (
    <div>
      <Link to="/" className="back-link">
        ← Back to events
      </Link>

      <h1>{event.name}</h1>
      <p className="muted event-meta">
        {formatDate(event.dateTime)} · 📍 {event.venue}
      </p>

      <SeatGrid seats={seats} selected={selected} onToggle={toggleSeat} />

      <div className="selection-bar">
        {selected.length > 0 ? (
          <span>
            Selected: <strong>{selected.join(", ")}</strong> ({selected.length})
          </span>
        ) : (
          <span className="muted">Select one or more available seats</span>
        )}

        {/* The Reserve action is wired up in Step 11. */}
        <button
          type="button"
          className="btn btn-primary"
          disabled={selected.length === 0}
        >
          Reserve{selected.length > 0 ? ` (${selected.length})` : ""}
        </button>
      </div>
    </div>
  );
}
