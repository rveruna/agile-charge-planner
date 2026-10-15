# Performance

Measured with `npm run perf:lighthouse` (median of 3 runs, mobile emulation, simulated Slow 4G, Chrome) against a
production build in sample mode, so no request goes to Octopus Energy and the numbers describe the app, not the API.

| Measure                            | Result                  |
| ---------------------------------- | ----------------------- |
| Performance score                  | 100                     |
| Accessibility, best practices, SEO | 100, 100, 100           |
| First and largest contentful paint | 1.5 s                   |
| Total blocking time                | 0 ms                    |
| Layout shift                       | 0                       |
| Page weight                        | 105 kB (scripts 103 kB) |

`npm run size` fails the build if the gzipped JavaScript passes 115 kB or the CSS passes 3 kB. Today's figures are
105.3 kB and 1.9 kB. Most of the JavaScript is React itself, then TanStack Query.

Not measured: the API's own response time, and how the app behaves on a real device. The live site also depends on
Octopus Energy's service being up.
