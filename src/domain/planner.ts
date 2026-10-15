import { HALF_HOUR_MS, type Slot } from './slot';

export type ChargeMode = 'together' | 'flexible';

export interface PlanInput {
  slots: Slot[];
  now: number;
  /** Only slots starting before this many hours from now are considered. `null` means all of them. */
  withinHours: number | null;
  hours: number;
  powerKw: number;
  mode: ChargeMode;
}

export interface Plan {
  /** The slots to charge in, in time order. */
  chosen: Slot[];
  energyKwh: number;
  costPence: number;
  averagePence: number;
  /** The same charge as one unbroken session from now. `null` when a gap in the prices means it cannot be priced. */
  startNowCostPence: number | null;
  savingPence: number | null;
}

export type PlanResult =
  | { kind: 'ok'; plan: Plan; considered: Slot[] }
  | { kind: 'too-short'; available: number; needed: number; considered: Slot[] };

/** How many half-hour slots a charge of this length needs. */
export function slotsNeeded(hours: number): number {
  return Math.max(1, Math.ceil(hours * 2 - 1e-9));
}

/** Slots that have not finished yet and start inside the chosen horizon. */
export function consideredSlots(slots: Slot[], now: number, withinHours: number | null): Slot[] {
  const horizon = withinHours === null ? Infinity : now + withinHours * 60 * 60 * 1000;
  return slots.filter((slot) => slot.end > now && slot.start < horizon);
}

/** Whether each slot starts where the one before it ends. */
function isUnbroken(slots: Slot[]): boolean {
  return slots.every((slot, j) => j === 0 || slot.start === slots[j - 1]!.end);
}

function sum(slots: Slot[]): number {
  return slots.reduce((total, slot) => total + slot.pence, 0);
}

/** The cheapest run of `count` back-to-back slots. Ties go to the earliest. */
export function cheapestTogether(slots: Slot[], count: number): Slot[] {
  let best: Slot[] = [];
  let bestTotal = Infinity;
  for (let i = 0; i + count <= slots.length; i++) {
    const window = slots.slice(i, i + count);
    if (!isUnbroken(window)) continue;
    const total = sum(window);
    if (total < bestTotal) {
      best = window;
      bestTotal = total;
    }
  }
  return best;
}

/** The cheapest `count` slots wherever they fall, for a charger that can pause. Ties go to the earliest. */
export function cheapestFlexible(slots: Slot[], count: number): Slot[] {
  return [...slots]
    .sort((a, b) => a.pence - b.pence || a.start - b.start)
    .slice(0, count)
    .sort((a, b) => a.start - b.start);
}

function costOf(slots: Slot[], powerKw: number): number {
  return sum(slots) * powerKw * (HALF_HOUR_MS / 3_600_000);
}

export function planCharge({ slots, now, withinHours, hours, powerKw, mode }: PlanInput): PlanResult {
  const considered = consideredSlots(slots, now, withinHours);
  const needed = slotsNeeded(hours);
  const chosen =
    mode === 'together' ? cheapestTogether(considered, needed) : cheapestFlexible(considered, needed);

  if (chosen.length < needed) {
    const available = mode === 'together' ? longestUnbrokenRun(considered) : considered.length;
    return { kind: 'too-short', available, needed, considered };
  }

  const energyKwh = needed * powerKw * (HALF_HOUR_MS / 3_600_000);
  const costPence = costOf(chosen, powerKw);
  // Starting now is one unbroken session, like a "together" charge, so it is never cheaper than the plan
  const startNow = considered.slice(0, needed);
  const startNowCostPence = isUnbroken(startNow) ? costOf(startNow, powerKw) : null;
  return {
    kind: 'ok',
    considered,
    plan: {
      chosen,
      energyKwh,
      costPence,
      averagePence: costPence / energyKwh,
      startNowCostPence,
      savingPence: startNowCostPence === null ? null : startNowCostPence - costPence,
    },
  };
}

function longestUnbrokenRun(slots: Slot[]): number {
  let longest = 0;
  let run = 0;
  slots.forEach((slot, i) => {
    run = i > 0 && slot.start === slots[i - 1]!.end ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  return longest;
}
