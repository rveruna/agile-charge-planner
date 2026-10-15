import { HALF_HOUR_MS, type Slot } from '../domain/slot';

export const T0 = Date.parse('2026-10-15T10:00:00Z');

/** Back-to-back slots from `start`, one per price. */
export function slotsFrom(prices: number[], start: number = T0): Slot[] {
  return prices.map((pence, i) => ({
    start: start + i * HALF_HOUR_MS,
    end: start + (i + 1) * HALF_HOUR_MS,
    pence,
  }));
}
