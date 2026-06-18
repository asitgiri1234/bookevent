import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { formatDate } from "../utils/format";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true; // guards against setting state after unmount
    client
      .get("/events")
      .then(({ data }) => active && setEvents(data))
      .catch(
        (err) =>
          active &&
          setError(err.response?.data?.message || "Failed to load events")
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="muted">Loading events…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1>Upcoming Events</h1>
      <div className="event-grid">
        {events.map((ev) => (
          <Link key={ev._id} to={`/events/${ev._id}`} className="event-card">
            <h2>{ev.name}</h2>
            <p className="muted">{formatDate(ev.dateTime)}</p>
            <p className="event-venue">📍 {ev.venue}</p>
            <span className="event-seats">{ev.totalSeats} seats</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
