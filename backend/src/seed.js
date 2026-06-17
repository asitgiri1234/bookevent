import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import Seat from "./models/Seat.js";
import Reservation from "./models/Reservation.js";

/**
 * Seed script: wipes existing events/seats/reservations and inserts a few
 * sample events, auto-generating a seat grid for each.
 *
 * Run with: npm run seed
 *
 * Seats are named by row letter + column number (A1, A2, ... E8). The number
 * of seats generated always equals rows * cols, which we also store as the
 * event's totalSeats so the two never disagree.
 */

// Sample events to create. `rows`/`cols` define the seat grid size.
const sampleEvents = [
  {
    name: "Coldplay Live in Concert",
    dateTime: new Date("2026-08-15T19:30:00"),
    venue: "Wankhede Stadium, Mumbai",
    rows: 5,
    cols: 8, // 40 seats
  },
  {
    name: "Stand-up Comedy Night",
    dateTime: new Date("2026-07-20T20:00:00"),
    venue: "The Comedy Club, Bengaluru",
    rows: 4,
    cols: 6, // 24 seats
  },
  {
    name: "Tech Conference 2026",
    dateTime: new Date("2026-09-10T09:00:00"),
    venue: "Convention Centre, Hyderabad",
    rows: 6,
    cols: 10, // 60 seats
  },
];

// Build seat documents for one event using row letters (A, B, C, ...).
const buildSeats = (eventId, rows, cols) => {
  const seats = [];
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r); // 65 = 'A'
    for (let c = 1; c <= cols; c++) {
      seats.push({
        eventId,
        seatNumber: `${rowLetter}${c}`,
        status: "available",
      });
    }
  }
  return seats;
};

const seed = async () => {
  try {
    await connectDB();

    // Start from a clean slate so re-running the seed is safe.
    await Promise.all([
      Reservation.deleteMany({}),
      Seat.deleteMany({}),
      Event.deleteMany({}),
    ]);
    console.log("Cleared existing events, seats, and reservations.");

    for (const { rows, cols, ...eventData } of sampleEvents) {
      const totalSeats = rows * cols;
      const event = await Event.create({ ...eventData, totalSeats });

      const seats = buildSeats(event._id, rows, cols);
      await Seat.insertMany(seats);

      console.log(`Created "${event.name}" with ${totalSeats} seats.`);
    }

    console.log("\nSeeding complete!");
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();
