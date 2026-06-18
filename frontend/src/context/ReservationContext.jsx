import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const ReservationContext = createContext(null);
const STORAGE_KEY = "activeReservation";

/**
 * Tracks the user's single active seat hold across the whole app and persists
 * it to localStorage, so the countdown survives navigation and page refresh.
 * The hold auto-clears when it expires.
 *
 * Shape: { reservationId, eventId, eventName, seatNumbers: [], expiresAt }
 */
export function ReservationProvider({ children }) {
  const [reservation, setReservation] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      const r = JSON.parse(stored);
      // Drop it if it already expired while the app was closed.
      if (new Date(r.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return r;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const startReservation = useCallback((r) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    setReservation(r);
  }, []);

  const clearReservation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setReservation(null);
  }, []);

  // Auto-clear exactly when the hold runs out, even if no timer is on screen.
  useEffect(() => {
    if (!reservation) return;
    const ms = new Date(reservation.expiresAt).getTime() - Date.now();
    if (ms <= 0) {
      clearReservation();
      return;
    }
    const id = setTimeout(clearReservation, ms);
    return () => clearTimeout(id);
  }, [reservation, clearReservation]);

  return (
    <ReservationContext.Provider
      value={{ reservation, startReservation, clearReservation }}
    >
      {children}
    </ReservationContext.Provider>
  );
}

export const useReservation = () => useContext(ReservationContext);
