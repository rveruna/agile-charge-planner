import { floorToHalfHour, HALF_HOUR_MS, type Slot } from '../domain/slot';

/** A small seeded random number generator, so the same day always gives the same sample. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Illustrative prices shaped like a typical Agile day: cheap overnight, a midday dip and an evening peak.
 * These are not real prices. They exist so the app can be used when the live service cannot be reached.
 */
export function sampleRates(now: number, slotCount = 96): Slot[] {
  const first = floorToHalfHour(now);
  const dayNumber = Math.floor(first / 86_400_000);
  const random = mulberry32(dayNumber);
  const noise = Array.from({ length: slotCount }, () => random() * 4 - 2);

  return Array.from({ length: slotCount }, (_, i) => {
    const start = first + i * HALF_HOUR_MS;
    const hour = (((start / 3_600_000) % 24) + 24) % 24;
    const overnight = hour < 6 ? -9 : 0;
    const middayDip = Math.exp(-(((hour - 13) / 2) ** 2)) * -6;
    const eveningPeak = Math.exp(-(((hour - 17.5) / 1.6) ** 2)) * 26;
    const pence = Math.round((19 + overnight + middayDip + eveningPeak + noise[i]!) * 100) / 100;
    return { start, end: start + HALF_HOUR_MS, pence };
  });
}
