import { describe, expect, test } from 'vitest';
import { actionLabel, detailSummary } from '../src/lib/audit';
import { errorMessage } from '../src/lib/errors';
import { formatBytes, formatDate, formatDateTime, formatTime, formatWait, groupKey, todayIso } from '../src/lib/format';
import { compressionPlan, fitWithin, jpegName, needsProcessing, normalizedName } from '../src/lib/imageSizing';
import { passwordHints, passwordOk } from '../src/lib/password';
import { interpretVersion, publishBlockReason, versionUrl } from '../src/lib/publishState';
import { qrPath } from '../src/lib/qr';

describe('format (WIB)', () => {
  const t = Date.UTC(2026, 9, 28, 5, 7, 0) / 1000; // 12:07 WIB
  test('time, date, datetime', () => {
    expect(formatTime(t)).toBe('12:07');
    expect(formatDate(t)).toBe('28 Okt 2026');
    expect(formatDateTime(t)).toBe('28 Okt 2026, 12:07 WIB');
    expect(formatTime('2026-10-28T20:30:00Z')).toBe('03:30');
    expect(todayIso(new Date('2026-10-28T20:30:00Z'))).toBe('2026-10-29');
  });
  test('bytes, waits, keys', () => {
    expect(formatBytes(1_234_000)).toBe('1,2 MB');
    expect(formatBytes(850_400)).toBe('850 KB');
    expect(formatWait(12)).toBe('12 detik');
    expect(formatWait(61)).toBe('2 menit');
    expect(groupKey('ABCDEFGHIJ')).toBe('ABCD EFGH IJ');
  });
});

describe('imageSizing', () => {
  test('fitWithin keeps ratio and never upscales', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(1200, 900)).toEqual({ width: 1200, height: 900 });
    expect(fitWithin(4032, 3024, 1000)).toEqual({ width: 1000, height: 750 });
  });
  test('needsProcessing', () => {
    expect(needsProcessing({ size: 500_000, type: 'image/jpeg' }, 1600)).toBe(false);
    expect(needsProcessing({ size: 3_000_000, type: 'image/jpeg' }, 1600)).toBe(true);
    expect(needsProcessing({ size: 500_000, type: 'image/jpeg' }, 2400)).toBe(true);
    expect(needsProcessing({ size: 500_000, type: 'image/png' }, 1200)).toBe(true);
  });
  test('compressionPlan starts at quality 0.82 and never goes below 800 px', () => {
    const plan = compressionPlan(4032, 3024);
    expect(plan[0]).toEqual({ width: 2000, height: 1500, quality: 0.82 });
    expect(plan.map((p) => p.quality).slice(0, 3)).toEqual([0.82, 0.72, 0.62]);
    expect(Math.min(...plan.map((p) => p.width))).toBeGreaterThanOrEqual(800);
    expect(plan.length).toBeGreaterThan(3);
  });
  test('names', () => {
    expect(jpegName('IMG_1234.HEIC')).toBe('IMG_1234.jpg');
    expect(jpegName('photo.png')).toBe('photo.jpg');
    expect(normalizedName('My Photo_1.JPG')).toBe('my-photo-1.jpg');
  });
});

describe('password hints', () => {
  test('mirror the server rules', () => {
    expect(passwordOk('Sangat-Rahasia-2026')).toBe(true);
    expect(passwordOk('short')).toBe(false);
    expect(passwordOk('aaaaaaaaaaaaaa')).toBe(false);
    expect(passwordOk('budi.santoso1', { email: 'budi.santoso1@promind.co.id' })).toBe(false);
    expect(passwordHints('').every((h) => !h.ok)).toBe(true);
  });
});

describe('audit labels', () => {
  test('known and unknown actions', () => {
    expect(actionLabel('content.publish')).toBe('Menerbitkan konten');
    expect(actionLabel('x.y')).toBe('x.y');
    expect(detailSummary('login.fail', { reason: 'totp' })).toBe('Alasan: kode autentikator salah');
    expect(detailSummary('user.update', { email: 'a@b.co', patch: { active: false, role: 'editor' } })).toBe('a@b.co: peran → editor, dinonaktifkan');
    expect(detailSummary('content.publish', { keys: ['careers'], commit: 'abcdef123456' })).toBe('careers (commit abcdef1)');
    expect(detailSummary('x', null)).toBe('');
  });
});

describe('errors', () => {
  test('rate limit shows the wait, unknown codes fall back', () => {
    expect(errorMessage('rate_limited', 'general', 300)).toContain('5 menit');
    expect(errorMessage('too_large', 'photo')).toContain('1,5 MB');
    expect(errorMessage('weird')).toContain('weird');
  });
});

describe('publish state', () => {
  const ok = { hasDraft: true, dirty: false, saving: false, saveFailed: false, issueCount: 0, changed: true };
  test('block reasons', () => {
    expect(publishBlockReason(ok)).toBeNull();
    expect(publishBlockReason({ ...ok, issueCount: 2 })).toContain('2 isian');
    expect(publishBlockReason({ ...ok, changed: false })).toContain('Belum ada perubahan');
    expect(publishBlockReason({ ...ok, dirty: true })).toContain('Menunggu');
    expect(publishBlockReason({ ...ok, saveFailed: true })).toContain('belum tersimpan');
  });
  test('version.json interpretation', () => {
    expect(interpretVersion({ commit: 'abc' }, 'abc')).toBe('live');
    expect(interpretVersion({ commit: 'old' }, 'abc')).toBe('waiting');
    expect(interpretVersion('nope', 'abc')).toBe('unknown');
    expect(versionUrl('https://promind.co.id/')).toBe('https://promind.co.id/version.json');
  });
});

describe('qr', () => {
  test('produces a square module grid path', () => {
    const { size, d } = qrPath('otpauth://totp/PROMIND%20Admin:a%40b.co?secret=ABC');
    expect(size).toBeGreaterThanOrEqual(21);
    expect(d.startsWith('M')).toBe(true);
  });
});
