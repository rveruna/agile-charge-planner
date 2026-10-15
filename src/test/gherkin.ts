import { describeFeature, type loadFeature } from '@amiceli/vitest-cucumber';

type Feature = Awaited<ReturnType<typeof loadFeature>>;
type StepFn = (...args: string[]) => void;

/** Defines the sentences a feature file may use. `{any}` in a pattern is passed to the step as a string. */
export type Vocabulary = (step: (pattern: string, fn: StepFn) => void) => void;

const KEYWORDS = ['Given', 'When', 'Then', 'And', 'But'] as const;

/**
 * Runs every scenario in a feature file against a shared vocabulary of steps, so adding a scenario only needs the
 * feature file. A step with no matching sentence still fails the run. Scenarios tagged `@ignore` are skipped.
 */
export function runFeature(feature: Feature, vocabulary: Vocabulary, reset: () => void): void {
  describeFeature(feature, ({ defineSteps, BeforeEachScenario, Rule, Scenario, ScenarioOutline }) => {
    BeforeEachScenario(reset);
    defineSteps((keywords) => {
      vocabulary((pattern, fn) => {
        // A sentence reads the same after Given, When, Then, And or But
        for (const keyword of KEYWORDS)
          keywords[keyword](pattern, (_ctx: unknown, ...args: string[]) => fn(...args));
      });
    });

    const noSteps = () => {};
    for (const scenario of feature.scenarii) {
      if ('examples' in scenario) ScenarioOutline(scenario.description, noSteps);
      else Scenario(scenario.description, noSteps);
    }
    for (const rule of feature.rules) {
      Rule(rule.name, ({ RuleScenario, RuleScenarioOutline }) => {
        for (const scenario of rule.scenarii) {
          if ('examples' in scenario) RuleScenarioOutline(scenario.description, noSteps);
          else RuleScenario(scenario.description, noSteps);
        }
      });
    }
  });
}
