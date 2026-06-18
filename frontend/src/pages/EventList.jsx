import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { formatDate } from "../utils/format";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
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

  return (
    <div>
      {/* Hero banner */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find your next experience</h1>
          <p>
            Concerts, comedy nights, conferences — reserve your seats in seconds.
          </p>
        </div>
      </section>

      <h2 className="section-title">Upcoming Events</h2>

      {loading && <p className="muted">Loading events…</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="event-grid">
          {events.map((ev) => (
            <Link key={ev._id} to={`/events/${ev._id}`} className="event-card">
              <div
                className="event-image"
                style={{ backgroundImage: `url(${ev.imageUrl})` }}
              >
                {ev.category && (
                  <span className="event-category">{ev.category}</span>
                )}
              </div>
              <div className="event-card-body">
                <h3>{ev.name}</h3>
                <p className="muted event-date">{formatDate(ev.dateTime)}</p>
                <p className="event-venue">📍 {ev.venue}</p>
                <div className="event-card-footer">
                  <span className="event-seats">{ev.totalSeats} seats</span>
                  <span className="event-book-link">Book →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
