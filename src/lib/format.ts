/** Shared display formatting for prices and countdowns (server + client safe). */

export function formatCurrency(amount: number): string {
  return `RM${amount}`;
}

/** e.g. "3h 28m remaining" / "42m remaining" / "Deadline passed". */
export function formatTimeRemaining(deadlineAt: number, now: number = Date.now()): string {
  const diffMs = deadlineAt - now;
  if (diffMs <= 0) return "Deadline passed";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
}

/** e.g. "Fri, 19 Sep" — used for estimated delivery dates. */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
