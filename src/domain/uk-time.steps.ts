import { loadFeature } from '@amiceli/vitest-cucumber';
import { runFeature, type Vocabulary } from '../test/gherkin';
import { describeSlots, formatClock, formatDay } from './format';
import { HALF_HOUR_MS } from './slot';

let starts: number[] = [];

const steps: Vocabulary = (step) => {
  step('a half-hour starting at {any}', (instant) => {
    starts = [Date.parse(instant)];
  });

  step('it is shown as starting at {any} on {any}', (clock, day) => {
    expect(formatClock(starts[0]!)).toBe(clock);
    expect(formatDay(starts[0]!)).toBe(day);
  });

  step('a plan that charges in the half-hours starting {any} UTC on {any}', (times, date) => {
    starts = times.split(',').map((time) => Date.parse(`${date}T${time.trim()}:00Z`));
  });

  step('the plan is described as {any}', (description) => {
    expect(describeSlots(starts.map((start) => ({ start, end: start + HALF_HOUR_MS })))).toBe(description);
  });
};

runFeature(await loadFeature('./uk-time.feature'), steps, () => {
  starts = [];
});
