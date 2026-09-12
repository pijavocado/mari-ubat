"use client";

import { useEffect, useState } from "react";

function formatRemaining(diffMs: number): string {
  if (diffMs <= 0) return "Deadline passed";

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
  return `${seconds}s remaining`;
}

/**
 * Ticks once a second on the client. The server-rendered value (computed a
 * moment earlier, during SSR) will differ from the client's first tick by a
 * second or two — expected for a live countdown, so hydration warnings for
 * this text are suppressed rather than worked around with extra complexity.
 */
export function CountdownTimer({ deadlineAt, className }: { deadlineAt: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Date.now() >= deadlineAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadlineAt]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatRemaining(deadlineAt - now)}
    </span>
  );
}
