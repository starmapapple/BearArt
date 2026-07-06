"use client";

import { useEffect, useState } from "react";

const defaultCountdownMinutes = 60;

export default function CountdownTimer({
  storageKey = "offer-countdown",
  label = "Berakhir dalam",
  compact = false,
  durationMinutes = defaultCountdownMinutes
}) {
  const countdownMs = durationMinutes * 60 * 1000;
  const [remaining, setRemaining] = useState(countdownMs);

  useEffect(() => {
    const key = `countdown-${storageKey}`;
    let deadline = Number(window.localStorage.getItem(key));

    function createNextDeadline() {
      deadline = Date.now() + countdownMs;
      window.localStorage.setItem(key, String(deadline));
    }

    if (!deadline || deadline <= Date.now()) {
      createNextDeadline();
    }

    function tick() {
      const nextRemaining = deadline - Date.now();
      if (nextRemaining <= 0) {
        createNextDeadline();
        setRemaining(countdownMs);
        return;
      }
      setRemaining(nextRemaining);
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [countdownMs, storageKey]);

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return (
    <div className={compact ? "countdown-timer compact" : "countdown-timer"} aria-label={`${label} ${minutes} menit ${seconds} detik`}>
      <span>{label}</span>
      <strong>{minutes}</strong>
      <em>:</em>
      <strong>{seconds}</strong>
    </div>
  );
}
