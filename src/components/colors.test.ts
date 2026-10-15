import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrastRatio } from '../domain/contrast';

// The palette lives in styles.css, so the test reads the shipped file rather than a copy that could drift from it
const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

function theme(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1]!, m[2]!]),
  );
}

describe.each([
  ['dark', theme(':root')],
  ['light', theme(":root[data-theme='light']")],
])('the %s palette', (_name, t) => {
  it('defines every colour the checks need', () => {
    for (const name of ['bg', 'surface', 'text', 'muted', 'accent', 'bar', 'bar-chosen', 'axis', 'focus']) {
      expect(t[name], name).toMatch(/^#/);
    }
  });

  it.each(['text', 'muted', 'accent'])('%s is at least 4.5:1 against the page and the cards', (name) => {
    expect(contrastRatio(t[name]!, t.bg!)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t[name]!, t.surface!)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['warn-bg', 'error-bg', 'quiet-bg'])('text is at least 4.5:1 on %s', (name) => {
    expect(contrastRatio(t.text!, t[name]!)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['bar', 'bar-chosen', 'axis'])(
    '%s is at least 3:1 against the chart card (WCAG graphics)',
    (name) => {
      expect(contrastRatio(t[name]!, t.surface!)).toBeGreaterThanOrEqual(3);
    },
  );

  it('the chosen bars stand out from the others by at least 3:1', () => {
    expect(contrastRatio(t['bar-chosen']!, t.bar!)).toBeGreaterThanOrEqual(3);
  });

  it('the focus ring is at least 3:1 against the page', () => {
    expect(contrastRatio(t.focus!, t.bg!)).toBeGreaterThanOrEqual(3);
  });
});
