import Seat from "./Seat";

// Group seats by their row letter (A, B, C…), preserving the order they arrive.
function groupRows(seats) {
  const rows = new Map();
  for (const seat of seats) {
    const row = seat.seatNumber.match(/^[A-Za-z]+/)?.[0] || "?";
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row).push(seat);
  }
  return [...rows.entries()];
}

const LEGEND = [
  { key: "available", label: "Available" },
  { key: "selected", label: "Selected" },
  { key: "reserved", label: "Reserved" },
  { key: "booked", label: "Booked" },
];

export default function SeatGrid({ seats, selected, onToggle }) {
  const rows = groupRows(seats);

  // A running index across all seats so the entrance animation staggers
  // smoothly from the first seat to the last.
  let seatIndex = 0;

  return (
    <div className="seat-area">
      <div className="screen-curve" />
      <p className="screen-label">STAGE / SCREEN</p>

      <div className="seat-grid">
        {rows.map(([row, rowSeats]) => (
          <div className="seat-row" key={row}>
            <span className="row-label">{row}</span>
            {rowSeats.map((seat) => (
              <Seat
                key={seat._id}
                seat={seat}
                selected={selected.includes(seat.seatNumber)}
                onToggle={onToggle}
                index={seatIndex++}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="legend">
        {LEGEND.map((item) => (
          <div className="legend-item" key={item.key}>
            <span className={`legend-swatch seat-${item.key}`} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
