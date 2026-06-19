import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ReservationBanner from "./components/ReservationBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import EventList from "./pages/EventList";
import EventDetail from "./pages/EventDetail";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <>
      <Navbar />
      <ReservationBanner />
      <main className="container">
        <Routes>
          {/* Protected: only logged-in users can browse and book */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <EventList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Public auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </>
  );
}
