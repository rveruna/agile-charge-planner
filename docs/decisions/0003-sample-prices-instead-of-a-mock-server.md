# 0003: A labelled sample mode instead of a mock server

Status: accepted

## Context

The app needs to be usable and testable when the live API is unavailable (offline, blocked, retired product), and CI
should not call Octopus's service to measure page speed.

## Decision

`?sample=1` (offered as a button whenever prices cannot be loaded) replaces the network with `sampleRates`, a
deterministic generator shaped like a typical Agile day: cheap overnight, a midday dip and an evening peak. The page
says in a note, in plain words, that these are not real prices. In this mode the network is never touched, and a test
checks that.

## Consequences

- Lighthouse in CI runs against sample mode, so it measures the app and not the API's response time, and it makes no
  requests to Octopus.
- The sample prices are invented. They exist to show how the planner behaves, and the note is part of the feature, not
  decoration.
- Unit tests of the API client use a mocked network (MSW) instead, so the real request and response handling is
  exercised.
