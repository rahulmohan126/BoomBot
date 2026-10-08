import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { PassThrough, type Readable } from 'node:stream';
import { YT_DLP_COOKIES_PATH, type Cookies } from '../config.js';

/** yt-dlp executable, overridable for installs outside PATH */
const DEFAULT_BINARY = process.env.YT_DLP_PATH || 'yt-dlp';
/** Buffer up to 10 MiB of audio ahead of playback */
const HIGH_WATER_MARK = 10 * (1 << 20);
/** Keep this much of yt-dlp's stderr for error messages */
const STDERR_LIMIT = 2000;

export interface YtDlpOptions {
  /** Netscape-format cookie file, if any */
  cookieFile?: string | null;
  proxy?: string | null;
  /** yt-dlp executable name or path */
  binary?: string;
}

export class YtDlpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YtDlpError';
  }
}

/**
 * Streams a video's best audio through yt-dlp. Resolves once audio starts arriving,
 * and rejects if yt-dlp can't be started or exits before producing any.
 * Destroying the returned stream stops yt-dlp.
 */
export function streamAudio(
  videoId: string,
  { cookieFile, proxy, binary = DEFAULT_BINARY }: YtDlpOptions = {},
): Promise<Readable> {
  const args = [
    '--quiet',
    '--no-warnings',
    '--no-playlist',
    '-f',
    'bestaudio[acodec=opus]/bestaudio/best',
    '-o',
    '-',
  ];
  if (proxy) args.push('--proxy', proxy);
  if (cookieFile) args.push('--cookies', cookieFile);
  args.push('--', `https://www.youtube.com/watch?v=${videoId}`);

  return new Promise((resolve, reject) => {
    const output = new PassThrough({ highWaterMark: HIGH_WATER_MARK });
    const failToStart = (err: Error) => {
      output.destroy();
      reject(new YtDlpError(`Could not run ${binary}: ${err.message}`));
    };

    let child;
    try {
      child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      // Some lookup failures (e.g. ENOTDIR from a PATH entry that's a file) throw synchronously
      failToStart(err as Error);
      return;
    }
    child.once('error', failToStart);

    // Ended on exit instead, so a failed exit can still error the stream
    child.stdout.pipe(output, { end: false });
    output.once('close', () => child.kill());

    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr = (stderr + chunk).slice(-STDERR_LIMIT);
    });

    let started = false;
    child.stdout.once('data', () => {
      started = true;
      resolve(output);
    });

    child.once('close', (code, signal) => {
      if (output.destroyed) return;
      if (code === 0 && started) {
        output.end();
        return;
      }

      const reason =
        code === 0 ? 'exited without producing audio' : `exited with ${code ?? signal}`;
      const error = new YtDlpError(`yt-dlp ${reason}${stderr.trim() ? `: ${stderr.trim()}` : ''}`);
      if (started) output.destroy(error);
      else {
        output.destroy();
        reject(error);
      }
    });
  });
}

/**
 * Writes cookies to a private file for yt-dlp and returns its path. It's a fixed path
 * overwritten on each start, so no copies pile up when the bot is killed without
 * cleaning up. Without cookies, a file left from an earlier run is removed.
 */
export function writeCookieFile(
  cookies: Cookies | null,
  file = YT_DLP_COOKIES_PATH,
): string | null {
  if (!cookies?.length) {
    rmSync(file, { force: true });
    return null;
  }

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, toNetscapeCookies(cookies), { mode: 0o600 });
  return file;
}

/**
 * Converts cookies to the Netscape cookie file format yt-dlp reads
 */
export function toNetscapeCookies(cookies: Cookies): string {
  const lines = cookies.map((cookie) => {
    const domain = typeof cookie.domain === 'string' ? cookie.domain : '.youtube.com';
    const path = typeof cookie.path === 'string' ? cookie.path : '/';
    const secure = cookie.secure === false ? 'FALSE' : 'TRUE';
    const expires =
      typeof cookie.expirationDate === 'number' ? Math.floor(cookie.expirationDate) : 0;
    const subdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE';
    return [domain, subdomains, path, secure, expires, cookie.name, cookie.value].join('\t');
  });

  return ['# Netscape HTTP Cookie File', ...lines, ''].join('\n');
}
