# Agreed behaviour, not a test. A failure here means the code is wrong —
# never edit a rule to make a build pass.
@area-planner
Feature: What a charge costs
  The cost is the unit rate times the energy. It leaves out the standing charge and charging losses.
  Times are UK time on a winter day, and prices are in pence per kWh.

  Rule: The cost is the charger's power, times the time, times the average price

    Scenario Outline: Energy, average price and cost
      Given the half-hourly prices from 00:00 are <prices>
      And the charger is <kw> kW
      When I plan to charge for <length>, together
      Then it uses <energy> kWh at an average of <average> and costs <cost>

      Examples:
        | prices         | kw  | length    | energy | average | cost   |
        | 10, 20, 30, 40 | 7   | 1 hour    | 7      | 15.0p   | £1.05  |
        | 10, 20, 30, 40 | 3.6 | 0.5 hours | 1.8    | 10.0p   | £0.18  |
        | 24, 24, 24, 24 | 22  | 2 hours   | 44     | 24.0p   | £10.56 |
        | 17             | 7   | 0.5 hours | 3.5    | 17.0p   | £0.60  |
        | -5, -5         | 7   | 1 hour    | 7      | -5.0p   | -£0.35 |

  Rule: The saving is against starting now, in the first half-hours available

    Scenario Outline: What starting now would cost
      Given the half-hourly prices from 00:00 are <prices>
      And the time is <time>
      When I plan to charge for 1 hour, together
      Then starting now would cost <now>, so the plan saves <saving>

      Examples:
        | prices         | time  | now    | saving |
        | 30, 30, 10, 10 | 00:00 | £2.10  | £1.40  |
        | 10, 10, 30, 30 | 00:00 | £0.70  | £0.00  |
        | 30, 30, 10, 10 | 00:45 | £1.40  | £0.70  |
        | -5, -5, 10, 10 | 00:00 | -£0.35 | £0.00  |
