import { contrastRatio } from '../domain/contrast';
import { colors } from './colors';

describe('chart palette', () => {
  it.each([
    ['bar', colors.bar],
    ['chosen bar', colors.barChosen],
    ['axis', colors.axis],
  ])('%s is at least 3:1 against the background (WCAG graphics)', (_name, colour) => {
    expect(contrastRatio(colour, colors.background)).toBeGreaterThanOrEqual(3);
  });

  it('text is at least 4.5:1 against the background', () => {
    expect(contrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('the chosen bars stand out from the others by at least 3:1', () => {
    expect(contrastRatio(colors.barChosen, colors.bar)).toBeGreaterThanOrEqual(3);
  });
});
