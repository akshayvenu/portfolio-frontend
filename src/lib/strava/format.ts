/** Display formatting for running numbers. Safe on server and client. */

/** `34:10`, `1:12:40`. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** `6:50` — minutes per km, no unit. */
export function formatPace(seconds: number, meters: number): string {
  if (meters <= 0) return "–";
  const perKm = seconds / (meters / 1000);
  return formatDuration(perKm);
}

/** `5.02` — kilometres to two decimals under 10, one above. */
export function formatKm(meters: number): string {
  const km = meters / 1000;
  return km < 10 ? km.toFixed(2) : km.toFixed(1);
}

/** `1,284` — whole kilometres with grouping. */
export function formatKmWhole(meters: number): string {
  return Math.round(meters / 1000).toLocaleString("en-US");
}

/** `86h` — whole hours. */
export function formatHours(seconds: number): string {
  return `${Math.round(seconds / 3600)}h`;
}

/** `Nov 24` or `Nov 24, 2025` when not this year. Takes a Strava local ISO string. */
export function formatShortDate(iso: string, currentYear?: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const sameYear = currentYear ? iso.startsWith(currentYear) : false;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

/** `Mon · 6:42 AM` from a Strava local ISO string. */
export function formatWeekdayTime(iso: string): string {
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${weekday} · ${time}`;
}

/** Whole days from `fromDay` to `toDay` (`YYYY-MM-DD`). */
export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round(
    (Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000,
  );
}

/** Parses `32:30` / `1:08:00` into seconds. */
export function parseDuration(text: string): number {
  return text
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}
