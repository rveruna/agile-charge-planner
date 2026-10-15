# Agreed behaviour, not a test. A failure here means the code is wrong —
# never edit a rule to make a build pass.
@area-planner
Feature: Choosing when to charge
  The planner looks at the half-hourly prices still to come and picks the half-hours to charge in.
  Times are UK time on a winter day, and prices are in pence per kWh.

  Rule: A charge done together is the cheapest unbroken run of half-hours

    Scenario Outline: The cheapest run of back-to-back half-hours
      Given the half-hourly prices from 00:00 are <prices>
      When I plan to charge for <length>, together
      Then it charges <chosen>

      Examples:
        | prices                | length    | chosen         |
        | 30, 12, 11, 40, 5, 50 | 1 hour    | 00:30 to 01:30 |
        | 5, 50, 12, 11, 40     | 1 hour    | 01:00 to 02:00 |
        | 30, 12, 11, 40        | 0.5 hours | 01:00 to 01:30 |
        | 10, 10, 30, 10, 10    | 1 hour    | 00:00 to 01:00 |
        | 20, 20, 20            | 1.5 hours | 00:00 to 01:30 |

    Scenario: A run is never joined across a gap in the prices
      Given the half-hourly prices from 00:00 are 9, 1, gap, 1, 9
      When I plan to charge for 1 hour, together
      Then it charges 00:00 to 01:00

  Rule: A charge that can pause takes the cheapest half-hours wherever they fall

    Scenario Outline: The cheapest half-hours, with pauses between them if need be
      Given the half-hourly prices from 00:00 are <prices>
      When I plan to charge for <length>, flexible
      Then it charges <chosen>

      Examples:
        | prices             | length    | chosen                         |
        | 30, 12, 25, 11, 40 | 1 hour    | 00:30 to 01:00, 01:30 to 02:00 |
        | 10, 20, 10, 10     | 1 hour    | 00:00 to 00:30, 01:00 to 01:30 |
        | 9, 1, gap, 1, 9    | 1 hour    | 00:30 to 01:00, 01:30 to 02:00 |
        | 5, 6, 7            | 1 hour    | 00:00 to 01:00                 |
        | 8, 8, 8            | 1.5 hours | 00:00 to 01:30                 |

  Rule: Negative prices, where you are paid to charge, are the cheapest of all

    Scenario Outline: Being paid to charge beats a price of zero or more
      Given the half-hourly prices from 00:00 are <prices>
      When I plan to charge for <length>, <mode>
      Then it charges <chosen>

      Examples:
        | prices       | length    | mode     | chosen                         |
        | 5, -3, -4, 9 | 1 hour    | together | 00:30 to 01:30                 |
        | -1, 0, 2, -2 | 1 hour    | flexible | 00:00 to 00:30, 01:30 to 02:00 |
        | 0, -0.5, 0   | 0.5 hours | together | 00:30 to 01:00                 |

  Rule: Only half-hours that have not finished and start inside "charge within" are used

    Scenario Outline: A half-hour starting at the limit is left out
      Given the half-hourly prices from 00:00 are 20, 20, 20, 20, 1, 1
      And I want it done within <within> hours
      When I plan to charge for 1 hour, together
      Then it charges <chosen>

      Examples:
        | within | chosen         |
        | 2      | 00:00 to 01:00 |
        | 3      | 02:00 to 03:00 |

    Scenario Outline: The half-hour under way counts until it ends
      Given the half-hourly prices from 00:00 are 1, 20, 20, 5
      And the time is <time>
      When I plan to charge for 0.5 hours, together
      Then it charges <chosen>

      Examples:
        | time  | chosen         |
        | 00:29 | 00:00 to 00:30 |
        | 00:30 | 01:30 to 02:00 |

  Rule: When the prices do not cover the charge, the planner says so instead of planning

    Scenario Outline: Too few prices, or no run long enough
      Given the half-hourly prices from 00:00 are <prices>
      When I plan to charge for <length>, <mode>
      Then it says only <available> of the <needed> half-hours needed are available

      Examples:
        | prices          | length    | mode     | available | needed |
        | 10, 10, 10      | 2 hours   | together | 3         | 4      |
        | 10, 10, 10      | 2 hours   | flexible | 3         | 4      |
        | 10, gap, 10, 10 | 1.5 hours | together | 2         | 3      |

    Scenario: "Charge within" can leave too little time
      Given the half-hourly prices from 00:00 are 10, 10, 10, 10, 10, 10
      And I want it done within 2 hours
      When I plan to charge for 3 hours, flexible
      Then it says only 4 of the 6 half-hours needed are available
