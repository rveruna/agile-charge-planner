# 0006: A dark theme, the answer first, and motion that explains

Status: accepted

## Context

The page opened on a settings form, so the answer to "when should I charge?" sat below the fold on a phone. The
design was plain white with no motion, and it read as a form rather than a tool.

## Decision

- The cheapest time is the first and largest thing on the page. The settings sit under it, and the table is behind
  a disclosure, with the chart pointing to it.
- The page is dark by default, with a light theme a visitor can choose. index.html applies a saved choice before
  first paint, so there is no flash of the wrong theme.
- Both palettes are CSS custom properties in styles.css, and colors.test.ts reads that file and checks every
  pairing: text at least 4.5:1 on the page, cards and banners, chart marks at least 3:1 on the card, chosen bars at
  least 3:1 from the others, and the focus ring at least 3:1. The test reads the shipped file, so it cannot drift
  from a copy.
- Every animation shows something: bars grow in from the axis, the chosen slots light up in order like a battery
  filling, heights move when the region changes, the answer rises in when it changes, and a "Now" line marks the
  current time. All of it is off under `prefers-reduced-motion`. Nothing flashes (WCAG 2.3.1).
- No animation library: CSS keyframes, transitions and a scroll-driven reveal where the browser supports it.

## Consequences

- Pure black was avoided (`#0b0f14` instead): white text on true black smears for some people with astigmatism.
- A first dark bar colour of `#56616d` was 2.78:1 against the card, under the 3:1 needed for graphics. The test
  caught it, and the bar is now `#606c79`.
- The saving is not animated as a count-up. It sits in a live region, and a counting number would be read out
  again and again; a test also checks the exact figure.
- The CSS grew from 0.9 kB to 1.9 kB gzipped, inside its 3 kB budget. Lighthouse stayed at 100 in all four
  categories.
