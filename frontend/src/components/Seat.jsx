/**
 * A single seat button. Available seats are clickable (and toggle selection);
 * reserved/booked seats are disabled. `mine` marks seats the current user is
 * holding via an active reservation. `index` drives the staggered entrance
 * animation so the grid fills in as a smooth wave.
 */
export default function Seat({ seat, selected, mine, onToggle, index }) {
  const status = selected ? "selected" : seat.status;
  const disabled = seat.status !== "available";

  // Show just the column number; the row letter labels each row already.
  const label = seat.seatNumber.replace(/^[A-Za-z]+/, "");

  return (
    <button
      type="button"
      className={`seat seat-${status}${mine ? " seat-mine" : ""}`}
      style={{ animationDelay: `${index * 12}ms` }}
      disabled={disabled}
      onClick={() => onToggle(seat)}
      title={`${seat.seatNumber} — ${mine ? "your hold" : status}`}
      aria-label={`Seat ${seat.seatNumber}, ${mine ? "your hold" : status}`}
    >
      {label}
    </button>
  );
}
