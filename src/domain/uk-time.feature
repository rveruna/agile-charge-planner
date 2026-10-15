# Agreed behaviour, not a test. A failure here means the code is wrong —
# never edit a rule to make a build pass.
@area-display
Feature: Showing times in UK time
  Prices come from the API with times in UTC. The page shows UK time whatever time zone the viewer is in.

  Rule: A half-hour is shown in UK time, including when the clocks change

    Scenario Outline: UTC times from the API shown as UK times
      Given a half-hour starting at <instant>
      Then it is shown as starting at <clock> on <day>

      Examples:
        | instant              | clock | day        |
        | 2026-12-01T22:30:00Z | 22:30 | Tue 1 Dec  |
        | 2026-07-01T22:30:00Z | 23:30 | Wed 1 Jul  |
        | 2026-07-01T23:30:00Z | 00:30 | Thu 2 Jul  |
        | 2026-12-01T00:00:00Z | 00:00 | Tue 1 Dec  |
        | 2026-03-29T00:30:00Z | 00:30 | Sun 29 Mar |
        | 2026-03-29T01:00:00Z | 02:00 | Sun 29 Mar |
        | 2026-10-25T00:30:00Z | 01:30 | Sun 25 Oct |
        | 2026-10-25T01:30:00Z | 01:30 | Sun 25 Oct |

  Rule: Back-to-back half-hours read as one stretch of time

    Scenario Outline: Joining half-hours into ranges
      Given a plan that charges in the half-hours starting <starts> UTC on <date>
      Then the plan is described as <description>

      Examples:
        | starts                     | date       | description                    |
        | 00:30, 01:00, 01:30, 04:00 | 2026-12-01 | 00:30 to 02:00, 04:00 to 04:30 |
        | 21:30, 22:00               | 2026-07-01 | 22:30 to 23:30                 |
        | 01:00, 02:00               | 2026-12-01 | 01:00 to 01:30, 02:00 to 02:30 |
