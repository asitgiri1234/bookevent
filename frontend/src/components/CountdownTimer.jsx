import { useEffect, useRef, useState } from "react";

/**
 * Live MM:SS countdown to `expiresAt`. Calls onExpire() once when it hits zero.
 * The frontend timer is purely informational — the backend independently
 * rejects bookings past expiresAt, so this is a UX aid, not the enforcer.
 */
export default function CountdownTimer({ expiresAt, onExpire }) {
  const secondsRemaining = () =>
    Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));

  const [secondsLeft, setSecondsLeft] = useState(secondsRemaining);

  // Keep the latest onExpire without re-subscribing the interval every render.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const tick = () => {
      const s = secondsRemaining();
      setSecondsLeft(s);
      if (s <= 0) onExpireRef.current?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const urgent = secondsLeft <= 60;

  return (
    <span className={`countdown${urgent ? " countdown-urgent" : ""}`}>
      {mm}:{ss}
    </span>
  );
}
