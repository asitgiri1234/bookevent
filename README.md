# BookEvent — Event Ticket Booking

A full-stack MERN application for booking event seats, focused on **seat
reservation and booking confirmation** with safe, concurrency-proof seat
locking.

Users browse events, pick seats on a live color-coded seat map, hold them for
**10 minutes** (with a countdown that survives page navigation), and confirm
the booking before the hold expires.

---

## Features

- **Authentication** — register / login with JWT, passwords hashed with bcrypt
- **Event listing & detail** — events with images, dates, venues, seat counts
- **Interactive seat map** — color-coded statuses (available / selected /
  reserved / booked), multi-seat selection
- **10-minute reservations** — atomic seat locking that prevents double booking
- **Persistent countdown** — a global timer banner that survives navigation and
  page refresh; click it to jump back and finish booking
- **Booking confirmation** — converts a reservation into a permanent booking
- **My Bookings** — a history of the user's confirmed bookings
- **Auto-expiry** — abandoned reservations free their seats automatically
- **Responsive UI** with clear loading and error states

---

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React (Vite), React Router, Axios, Context API |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT, bcryptjs |

---

## Project Structure

```
bookevent/
├── backend/
│   ├── src/
│   │   ├── models/        User, Event, Seat, Reservation, Booking
│   │   ├── controllers/   auth, event, reserve, booking logic
│   │   ├── routes/        Express routers
│   │   ├── middleware/    JWT auth guard, error handler
│   │   ├── utils/         token + expiry helpers
│   │   ├── config/        MongoDB connection
│   │   ├── seed.js        sample events + seats
│   │   └── app.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/           axios client
        ├── context/       AuthContext, ReservationContext
        ├── components/    SeatGrid, Seat, CountdownTimer, Navbar, …
        ├── pages/         EventList, EventDetail, MyBookings, Login, Register
        └── App.jsx
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Backend

```bash
cd backend
npm install

# create your env file
cp .env.example .env
# then edit .env (see below)

npm run seed      # populate sample events and seats
npm run dev       # start the API (http://localhost:5000)
```

**`backend/.env`:**

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
PORT=5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # start the app (http://localhost:5173)
```

By default the frontend calls the API at `http://localhost:5000/api`. To point
it elsewhere, create `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Open **http://localhost:5173**, register an account, and book a seat.

> Deploying? See **[DEPLOYMENT.md](DEPLOYMENT.md)** for Vercel (frontend) +
> Render (backend).

---

## API Endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create an account, returns a JWT |
| POST | `/api/auth/login` | – | Log in, returns a JWT |
| GET | `/api/events` | – | List all events |
| GET | `/api/events/:id` | – | Event details + full seat grid |
| POST | `/api/reserve` | ✅ | Reserve seats for 10 minutes |
| POST | `/api/bookings` | ✅ | Confirm a reservation into a booking |
| GET | `/api/bookings` | ✅ | The current user's bookings |

Protected routes expect an `Authorization: Bearer <token>` header.

---

## Design Decisions

### How double booking is prevented

The **Seat document is the single source of truth** for availability, and seats
are claimed with an **atomic conditional update** rather than a read-then-write:

```js
Seat.findOneAndUpdate(
  { eventId, seatNumber, status: "available" },  // condition
  { $set: { status: "reserved", reservationId, lockedBy, reservedUntil } }
);
```

Because a single-document update is atomic in MongoDB, only **one** concurrent
request can flip a given seat from `available → reserved` — every other request
gets `null` for that seat and is rejected with a `409 Conflict`. If a request
wins some seats but loses one, it **rolls back** the seats it grabbed (matched
by its own `reservationId`, so it never frees someone else's seats).

This was verified with a 5-way concurrency test: out of five simultaneous
requests for the same seat, exactly one succeeds.

### How reservations expire

A reservation lasts 10 minutes, enforced on two layers:

1. **Booking check** — `POST /api/bookings` rejects a reservation whose
   `expiresAt` has passed, so an expired hold can never be booked.
2. **Seat auto-release** — each seat stores `reservedUntil`; a lazy cleanup runs
   before availability is read or changed, flipping expired holds back to
   `available` in one atomic bulk update. A TTL index on the reservation is used
   only for housekeeping, never as the safety mechanism.

The frontend countdown is purely a UX aid — the backend is the real enforcer.

### Reserved vs booked

- **Reserved** = a temporary 10-minute hold that auto-frees if not confirmed.
- **Booked** = permanent. Confirming a booking stands in for a successful
  payment (see assumptions).

---

## Assumptions

- **No payment gateway.** The "Confirm Booking" action represents a successful
  payment — reservations hold seats for 10 minutes and confirmed bookings are
  permanent.
- **Email is not verified.** Registration logs the user in directly; the email
  field isn't checked for deliverability (kept simple for this scope).
- **Seats are generated per event** when seeded, named by row letter + column
  (e.g. `A1`…`E8`). The grid size is defined in the seed script.
- A user holds **one active reservation at a time** in the UI.

---

## Scripts

**Backend**
- `npm run dev` — start with nodemon
- `npm start` — start the server
- `npm run seed` — reset and seed sample events/seats

**Frontend**
- `npm run dev` — start the Vite dev server
- `npm run build` — production build
