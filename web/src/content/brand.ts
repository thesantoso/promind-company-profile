const CANONICAL: Record<string, string> = { promind: 'PROMIND', proapps: 'PROAPPS' };

/** Brand names written in the wrong case. Emails and hostnames (lowercase by nature) are allowed. */
export function findBrandViolations(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(/\b(promind|proapps)\b/gi)) {
    const word = m[0];
    if (word === CANONICAL[word.toLowerCase()]) continue;
    const before = text[m.index! - 1] ?? '';
    const after = text.slice(m.index! + word.length, m.index! + word.length + 2);
    const isHostOrEmail = /[@./]/.test(before) || /^\.[a-z]/i.test(after);
    if (!isHostOrEmail) found.push(word);
  }
  return found;
}
