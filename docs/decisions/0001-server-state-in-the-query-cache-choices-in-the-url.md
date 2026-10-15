# 0001: Prices live in TanStack Query; the user's choices live in the URL

Status: accepted

## Context

The app has two kinds of state. Prices come from a server, can be stale, can fail and are shared by anything that
needs them. Choices (region, length of charge, charger power, style, horizon) belong to the user and should survive
a reload and travel in a link.

## Decision

- Prices are fetched and cached by TanStack Query, keyed by region only (`['rates', region]`).
- Choices are kept in the URL query string and read with a Zod schema (`src/domain/settings.ts`,
  `src/hooks/useSettings.ts`). Anything missing or not recognised falls back to a default, and only values that
  differ from the defaults are written, so a shared link stays short.
- The plan (cheapest slots, cost) is not state at all. It is computed from prices and choices in `useMemo`.

## Consequences

- Changing the charge length or power never refetches, because only the region is part of the query key.
- A link reproduces the view, and the back button works.
- `useSettings` is about 30 lines of `useSyncExternalStore` over `popstate` and one custom event, so there is no
  router dependency. A real router would be the next step if the app grew more pages.
