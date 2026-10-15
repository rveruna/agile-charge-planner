import { z } from 'zod';

export const HALF_HOUR_MS = 30 * 60 * 1000;

/** One half-hour price. `pence` is the unit rate in pence per kWh including VAT, and can be negative. */
export interface Slot {
  start: number;
  end: number;
  pence: number;
}

const isoInstant = z.iso.datetime().transform((value) => Date.parse(value));

const rawRate = z.object({
  value_inc_vat: z.number().finite(),
  valid_from: isoInstant,
  valid_to: isoInstant,
});

/** The part of the Octopus "standard unit rates" response this app depends on. */
export const ratesResponseSchema = z.object({
  results: z.array(rawRate),
});

/**
 * Turns a validated response into slots sorted by start time, with malformed
 * periods (ending before they start) and duplicate starts removed.
 */
export function toSlots(response: z.infer<typeof ratesResponseSchema>): Slot[] {
  const byStart = new Map<number, Slot>();
  for (const rate of response.results) {
    if (rate.valid_to <= rate.valid_from) continue;
    byStart.set(rate.valid_from, { start: rate.valid_from, end: rate.valid_to, pence: rate.value_inc_vat });
  }
  return [...byStart.values()].sort((a, b) => a.start - b.start);
}

/** Floors a time to the start of its half hour. */
export function floorToHalfHour(ms: number): number {
  return Math.floor(ms / HALF_HOUR_MS) * HALF_HOUR_MS;
}
