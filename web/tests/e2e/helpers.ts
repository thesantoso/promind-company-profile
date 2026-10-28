import { expect, type Page } from '@playwright/test';

/**
 * Plain ordinal labels ("01") are part of the live design; boxed number badges are not.
 * Every leaf element whose text is a bare one- or two-digit number must be small,
 * unfilled and unbordered text.
 */
export async function expectNoNumberBadges(page: Page) {
  const numerals = await page.locator('main *').evaluateAll((els) =>
    els
      .filter((e) => e.children.length === 0 && /^\d{1,2}$/.test((e.textContent ?? '').trim()))
      .map((e) => {
        const s = getComputedStyle(e);
        const bg = s.backgroundColor;
        return {
          text: e.textContent!.trim(),
          filled: bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent',
          bordered: ['Top', 'Right', 'Bottom', 'Left'].some((side) => parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0),
          fontSize: parseFloat(s.fontSize),
        };
      }),
  );
  for (const n of numerals) {
    expect(n.filled, `numeral ${n.text} has a background`).toBe(false);
    expect(n.bordered, `numeral ${n.text} has a border`).toBe(false);
    expect(n.fontSize, `numeral ${n.text} is display-sized`).toBeLessThanOrEqual(14);
  }
}
