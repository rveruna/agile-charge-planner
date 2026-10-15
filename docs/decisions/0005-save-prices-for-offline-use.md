# 0005: Save prices in the browser and say when they are saved ones

Status: accepted

## Context

The point of the app is to look ahead, and prices for the next day stay valid when the connection drops (a phone in a
car park, say). Showing nothing then would be unhelpful, and quietly showing old data would be worse.

## Decision

The query cache is saved to `localStorage` (TanStack's persister) for up to 24 hours. If a refresh fails or the browser
is offline, the saved prices are shown with a visible note giving the time they were saved, and a Try again button.
If there are no saved prices for the region, the app says so and offers the sample prices. Storage that is blocked is
handled by not saving.

## Consequences

- Prices are treated as fresh for five minutes, which is how long Octopus's own response is cacheable
  (`cache-control: max-age=300`), so the app never asks more often than that for the same region.
- Past slots are filtered out against the current time, so saved prices that have partly expired simply cover
  less time, and if they no longer cover enough, the interface says the data is too short rather than guessing.
- A full offline start would need a service worker, which is not included.
