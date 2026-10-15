# 0007: The planner's rules as executable feature files

Status: accepted

## Context

The rules the app promises (a charge done together is one unbroken run, negative prices are the cheapest, the saving
is against starting now, times are UK time) were spread across the README and unit tests named after functions. A
reader had to know the code to find out what the app agrees to do, and nothing stopped a rule being quietly changed
along with its test.

## Decision

- The rules are written in Gherkin, in plain English, in `src/domain/*.feature`, grouped by `Rule:` with
  `Scenario Outline` tables. Each table includes the boundary cases: equal prices, a charge that only just fits, a
  half-hour starting exactly at the "charge within" limit, half a penny of rounding.
- Each file starts with the same two lines: the rules are agreed behaviour, not tests, and a failure means the code
  is wrong. A rule is never edited to make a build pass.
- Steps call the domain functions directly (`planCharge`, `describeSlots`, `formatClock` and so on). There is no
  browser, network or React, so the 42 scenarios run in a fraction of a second.
- `X.feature` sits beside `X.steps.ts`. The steps files run every scenario in their feature through a shared set of
  sentences (`src/test/gherkin.ts`, with the planner's in `src/test/planner-steps.ts`), so a new scenario that uses
  existing sentences needs only the feature file. A sentence with no matching step still fails the run.
- They run with [`@amiceli/vitest-cucumber`](https://github.com/amiceli/vitest-cucumber) inside the existing
  `npm test` and `npm run test:coverage`. The tests already run on Vitest; jest-cucumber is built for Jest, and
  using it would mean a second test runner and a second configuration for the same code. cucumber-js would also be
  a separate runner, outside the coverage report.

## Consequences

- The proof that the rules bind to the code: making `cheapestTogether` pick the most expensive run failed 13 steps
  across three rules, and removing its check for gaps in the data failed 2. Both changes were then undone.
- Writing the scenarios found no bugs. A scenario that shows one is tagged `@ignore` (skipped by default) and listed
  as a bug, and the code is fixed rather than the rule.
- Vitest counts each step as a test, so the test count went from 146 to 275 for 42 scenarios.
- The package is a dev dependency, and the JavaScript bundle stayed at 105.2 kB gzipped.
- Step sentences use `{any}` placeholders and receive strings, so each step converts its own numbers.

## Adding a scenario

1. Add a row to an `Examples` table, or a new `Scenario` under the right `Rule:`, using sentences already in the
   file.
2. Run `npm test`. If it reports a step with no match, add the sentence to the vocabulary in the steps file (or in
   `src/test/planner-steps.ts` for the planner).
3. Only write a rule the app already promises in the README or a decision record.
