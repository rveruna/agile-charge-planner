# 0002: Validate the API response with Zod and report failures by kind

Status: accepted

## Context

The prices come from someone else's service, and TypeScript types do not exist at runtime. A changed field name or a
string where a number was expected would otherwise show up as `NaN` in the chart.

## Decision

`fetchRates` parses the body with a Zod schema before anything uses it, and turns every failure into a `RatesError`
with a kind: `network` (could not connect), `http` (a status other than 2xx, with the status) or `invalid` (not JSON,
or not the expected shape). The interface words each kind differently. Periods that end before they start are dropped
and duplicate start times are collapsed, and the slots are sorted by start time, because the API's ordering is not
something to rely on.

## Consequences

- Only the fields the app uses are validated (`value_inc_vat`, `valid_from`, `valid_to`), so additions by Octopus
  do not break it.
- The product code (`AGILE-24-10-01`) is a constant. If Octopus retires it, the API answers 404 and the app says so
  rather than showing wrong prices. Following a new code automatically would mean reading the product list.
- The client does not follow pagination. One request with a page size of 200 is enough for the slots Octopus has
  published ahead (26 when this was checked in the middle of the day, before the next day's prices are out).
