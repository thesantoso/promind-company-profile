import { describe, expect, test } from 'vitest';
import { allStrings, englishStrings, findBritishSpelling, findUnexplainedAbbreviations } from './rules';

describe('findBritishSpelling', () => {
  test('finds British spellings, case-insensitively, and returns the words', () => {
    expect(findBritishSpelling('Training Centre for multi-storey buildings')).toEqual(['Centre', 'storey']);
    expect(findBritishSpelling('We optimise our programme')).toEqual(['optimise', 'programme']);
  });
  test('leaves US spelling and substrings alone', () => {
    expect(findBritishSpelling('Training Center for multi-story buildings, centred on color')).toEqual([]);
    expect(findBritishSpelling('Greyhound and storeyed'.replace('Greyhound', 'Graybound'))).toEqual([]);
  });
});

describe('findUnexplainedAbbreviations', () => {
  test('flags a bare OHS but not when spelled out', () => {
    expect(findUnexplainedAbbreviations('OHS certification')).toEqual(['OHS']);
    expect(findUnexplainedAbbreviations('occupational health and safety (K3)')).toEqual([]);
  });
});

describe('string walkers', () => {
  const data = { a: { id: 'satu', en: 'one' }, list: { id: ['dua'], en: ['two', 'three'] }, n: 5, x: [{ id: 'y', en: 'z' }] };
  test('allStrings returns every string with its path', () => {
    expect(allStrings(data).map(([p]) => p).sort()).toEqual(['a.en', 'a.id', 'list.en[0]', 'list.en[1]', 'list.id[0]', 'x[0].en', 'x[0].id']);
  });
  test('englishStrings returns only text under an "en" key', () => {
    expect(englishStrings(data).map(([, s]) => s).sort()).toEqual(['one', 'three', 'two', 'z']);
  });
});
