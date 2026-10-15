import { HALF_HOUR_MS } from './slot';

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const day = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** "21:30" in UK time, whatever the viewer's own time zone. */
export function formatClock(ms: number): string {
  return clock.format(ms);
}

/** "Thu 15 Oct" in UK time. */
export function formatDay(ms: number): string {
  return day.format(ms);
}

/** "21:30 to 22:00" */
export function formatRange(start: number, end: number = start + HALF_HOUR_MS): string {
  return `${formatClock(start)} to ${formatClock(end)}`;
}

/** Pence per kWh to one decimal place: "-2.4p". */
export function formatPence(pence: number): string {
  return `${(Math.round(pence * 10) / 10).toFixed(1)}p`;
}

/** Pence as pounds: "£1.23", or "-£0.40" for a credit. */
export function formatPounds(pence: number): string {
  const whole = Math.round(Math.abs(pence));
  const text = `£${(whole / 100).toFixed(2)}`;
  return pence < 0 && whole > 0 ? `-${text}` : text;
}

/** Joins consecutive slots into ranges: "00:30 to 03:00, 04:00 to 04:30". */
export function describeSlots(slots: { start: number; end: number }[]): string {
  const ranges: { start: number; end: number }[] = [];
  for (const slot of slots) {
    const last = ranges[ranges.length - 1];
    if (last && last.end === slot.start) last.end = slot.end;
    else ranges.push({ start: slot.start, end: slot.end });
  }
  return ranges.map((r) => formatRange(r.start, r.end)).join(', ');
}
