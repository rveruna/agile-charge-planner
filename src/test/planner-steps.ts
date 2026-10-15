import { describeSlots, formatPence, formatPounds } from '../domain/format';
import { planCharge, type ChargeMode, type PlanResult } from '../domain/planner';
import { HALF_HOUR_MS, type Slot } from '../domain/slot';
import type { Vocabulary } from './gherkin';

// A winter day, so UK time and UTC agree and "00:30" in a feature file means 00:30 UTC
const DAY = Date.parse('2026-01-15T00:00:00Z');

function at(clock: string): number {
  const [hours, minutes] = clock.split(':').map(Number);
  return DAY + (hours! * 60 + minutes!) * 60_000;
}

let world: {
  slots: Slot[];
  now: number;
  withinHours: number | null;
  powerKw: number;
  result?: PlanResult;
};

export function resetPlanner(): void {
  world = { slots: [], now: DAY, withinHours: null, powerKw: 7 };
}

function plan(result: PlanResult | undefined) {
  if (result?.kind !== 'ok') throw new Error(`Expected a plan, got ${JSON.stringify(result?.kind)}`);
  return result.plan;
}

/** The sentences the planner's feature files can use. */
export const plannerSteps: Vocabulary = (step) => {
  // "10, 12.5, -3, gap, 8": one price in pence per kWh per half-hour, and "gap" where there is no price
  step('the half-hourly prices from {any} are {any}', (clock, prices) => {
    const start = at(clock);
    prices.split(',').forEach((text, i) => {
      if (text.trim() === 'gap') return;
      const slotStart = start + i * HALF_HOUR_MS;
      world.slots.push({ start: slotStart, end: slotStart + HALF_HOUR_MS, pence: Number(text) });
    });
  });

  step('the time is {any}', (clock) => {
    world.now = at(clock);
  });

  step('I want it done within {any} hours', (hours) => {
    world.withinHours = Number(hours);
  });

  step('the charger is {any} kW', (kw) => {
    world.powerKw = Number(kw);
  });

  // "1.5 hours, together" or "1 hour, flexible"
  step('I plan to charge for {any}, {any}', (length, mode) => {
    world.result = planCharge({
      slots: world.slots,
      now: world.now,
      withinHours: world.withinHours,
      hours: parseFloat(length),
      powerKw: world.powerKw,
      mode: mode as ChargeMode,
    });
  });

  step('it charges {any}', (expected) => {
    expect(describeSlots(plan(world.result).chosen)).toBe(expected);
  });

  step('it says only {any} of the {any} half-hours needed are available', (available, needed) => {
    expect(world.result).toMatchObject({
      kind: 'too-short',
      available: Number(available),
      needed: Number(needed),
    });
  });

  step('it uses {any} kWh at an average of {any} and costs {any}', (energy, average, cost) => {
    const { energyKwh, averagePence, costPence } = plan(world.result);
    expect(energyKwh).toBeCloseTo(Number(energy));
    expect(formatPence(averagePence)).toBe(average);
    expect(formatPounds(costPence)).toBe(cost);
  });

  step('starting now would cost {any}, so the plan saves {any}', (startNow, saving) => {
    const { startNowCostPence, savingPence } = plan(world.result);
    expect(formatPounds(startNowCostPence)).toBe(startNow);
    expect(formatPounds(savingPence)).toBe(saving);
  });
};
