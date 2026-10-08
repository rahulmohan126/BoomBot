/**
 * Formats a duration as HH:MM:SS, dropping the hour section when it is zero
 */
export function formatDuration(ms: number): string {
  const time = new Date(Math.max(0, ms)).toISOString().slice(11, 19);
  return time.startsWith('00:') ? time.slice(3) : time;
}

/**
 * Formats a duration as e.g. "1d 2h 3m 4s"
 */
export function formatUptime(ms: number): string {
  let seconds = Math.round(ms / 1000);
  const units: [string, number][] = [
    ['d', 86_400],
    ['h', 3_600],
    ['m', 60],
  ];

  const parts: string[] = [];
  for (const [suffix, size] of units) {
    if (seconds >= size) {
      parts.push(`${Math.floor(seconds / size)}${suffix}`);
      seconds %= size;
    }
  }
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Renders a text progress bar such as |-----🔘---------------|
 */
export function progressBar(ratio: number, length = 20): string {
  const clamped = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 0;
  const filled = Math.round(clamped * length);
  return `|${'-'.repeat(filled)}🔘${'-'.repeat(length - filled)}|`;
}
