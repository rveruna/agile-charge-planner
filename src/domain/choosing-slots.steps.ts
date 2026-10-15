import { loadFeature } from '@amiceli/vitest-cucumber';
import { runFeature } from '../test/gherkin';
import { plannerSteps, resetPlanner } from '../test/planner-steps';

runFeature(await loadFeature('./choosing-slots.feature'), plannerSteps, resetPlanner);
