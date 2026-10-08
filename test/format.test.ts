import { describe, expect, it } from 'vitest';
import { formatDuration, formatUptime, progressBar } from '../src/ui/format.js';

describe('formatDuration', () => {
  it('drops the hour section when zero', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65_000)).toBe('01:05');
  });

  it('keeps hours when present', () => {
    expect(formatDuration(3_723_000)).toBe('01:02:03');
  });

  it('clamps negative durations', () => {
    expect(formatDuration(-5_000)).toBe('00:00');
  });
});

describe('formatUptime', () => {
  it('formats each unit', () => {
    expect(formatUptime((86_400 + 3_600 * 2 + 60 * 3 + 4) * 1000)).toBe('1d 2h 3m 4s');
  });

  it('includes exact unit boundaries', () => {
    expect(formatUptime(60_000)).toBe('1m');
  });

  it('shows 0s right after startup', () => {
    expect(formatUptime(0)).toBe('0s');
  });
});

describe('progressBar', () => {
  it('places the marker proportionally', () => {
    expect(progressBar(0)).toBe(`|🔘${'-'.repeat(20)}|`);
    expect(progressBar(0.5)).toBe(`|${'-'.repeat(10)}🔘${'-'.repeat(10)}|`);
    expect(progressBar(1)).toBe(`|${'-'.repeat(20)}🔘|`);
  });

  it('clamps out-of-range ratios', () => {
    expect(progressBar(2)).toBe(progressBar(1));
    expect(progressBar(Number.NaN)).toBe(progressBar(0));
  });
});
