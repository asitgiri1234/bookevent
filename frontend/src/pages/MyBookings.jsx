import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { formatDate } from "../utils/format";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    client
      .get("/bookings")
      .then(({ data }) => active && setBookings(data))
      .catch(
        (err) =>
          active &&
          setError(err.response?.data?.message || "Failed to load bookings")
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1>My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <p className="muted">You haven't booked any seats yet.</p>
          <Link to="/" className="btn btn-primary">
            Browse events
          </Link>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <div key={b._id} className="booking-card">
              {b.eventId?.imageUrl && (
                <div
                  className="booking-image"
                  style={{ backgroundImage: `url(${b.eventId.imageUrl})` }}
                />
              )}
              <div className="booking-body">
                <h2>{b.eventId?.name || "Event"}</h2>
                {b.eventId && (
                  <p className="muted">
                    {formatDate(b.eventId.dateTime)} · {b.eventId.venue}
                  </p>
                )}
                <div className="booking-seats">
                  {b.seatNumbers.map((s) => (
                    <span key={s} className="seat-chip">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="muted booking-meta">
                  Booked on {formatDate(b.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
