import { useParams } from "react-router-dom";

// Placeholder — the seat grid, reserve, and booking UI come in Steps 10–12.
export default function EventDetail() {
  const { id } = useParams();
  return (
    <div className="page">
      <h1>Event Detail</h1>
      <p className="muted">Seat grid for event {id} coming in Step 10.</p>
    </div>
  );
}
