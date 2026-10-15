# 0004: A chart backed by a table, with a palette whose contrast is tested

Status: accepted

## Context

A bar chart is the quickest way to see where the cheap slots are, but a picture is not available to everyone: screen
reader users cannot read it, and people with low vision or colour blindness may not tell its colours apart.

## Decision

- The chart is an SVG with `role="img"` and a label that gives the date range, the lowest and highest prices and the
  cheapest charge, then points to the table.
- The table lists every slot, marks the chosen ones in text ("Charge here") and not only by background colour.
- The chosen bars are also marked by a strip under the axis, so colour is not the only cue.
- The colours are in one file (since [0006](0006-dark-theme-answer-first-and-motion-that-explains.md), the custom
  properties in styles.css), and a test checks their contrast: at least 3:1 against the background (non-text) and
  at least 3:1 between chosen and unchosen bars.
- Both the chart and the table sit in keyboard-focusable scroll regions. On narrow screens the chart scrolls
  instead of shrinking until its labels are unreadable.

## Consequences

- The contrast test failed on the first palette: the chosen and unchosen bars differed by 1.14:1, which looks fine to
  most people and is close to invisible to some. That is why the palette is tested and not eyeballed.
- Colour contrast is not checked by axe in jsdom, so it is checked in real Chrome (axe and Lighthouse) as well.
