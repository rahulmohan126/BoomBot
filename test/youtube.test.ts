import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { text } from 'node:stream/consumers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { toCookieHeader } from '../src/youtube/http.js';
import {
  streamAudio,
  toNetscapeCookies,
  writeCookieFile,
  YtDlpError,
} from '../src/youtube/ytdlp.js';

describe('toCookieHeader', () => {
  it('joins cookie objects', () => {
    expect(
      toCookieHeader([
        { name: 'A', value: '1' },
        { name: 'B', value: '2' },
      ]),
    ).toBe('A=1; B=2');
  });

  it('treats empty input as unset', () => {
    expect(toCookieHeader([])).toBeUndefined();
    expect(toCookieHeader(null)).toBeUndefined();
  });
});

describe('streamAudio', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'boombot-ytdlp-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  /** Writes a shell script standing in for yt-dlp */
  async function fakeYtDlp(name: string, body: string): Promise<string> {
    const binary = join(dir, name);
    await writeFile(binary, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
    return binary;
  }

  it('streams stdout, passing the video URL, proxy and cookie file', async () => {
    const stream = await streamAudio('abc123', {
      binary: await fakeYtDlp('echo-args', 'echo "$@"'),
      proxy: 'http://10.0.0.1:8080',
      cookieFile: '/tmp/cookies.txt',
    });

    const output = await text(stream);
    expect(output).toContain('-o -');
    expect(output).toContain('-f bestaudio[acodec=opus]/bestaudio/best');
    expect(output).toContain('--proxy http://10.0.0.1:8080');
    expect(output).toContain('--cookies /tmp/cookies.txt');
    expect(output.trim().endsWith('-- https://www.youtube.com/watch?v=abc123')).toBe(true);
  });

  it('runs without cookies or a proxy', async () => {
    const stream = await streamAudio('abc123', {
      binary: await fakeYtDlp('echo-bare', 'echo "$@"'),
    });

    const output = await text(stream);
    expect(output).not.toContain('--cookies');
    expect(output).not.toContain('--proxy');
  });

  it('rejects with stderr when yt-dlp fails before producing audio', async () => {
    const binary = await fakeYtDlp('fail', 'echo "ERROR: Video unavailable" >&2; exit 1');
    await expect(streamAudio('abc123', { binary })).rejects.toThrow(
      'yt-dlp exited with 1: ERROR: Video unavailable',
    );
  });

  it('rejects when yt-dlp is not installed', async () => {
    await expect(streamAudio('abc123', { binary: join(dir, 'missing') })).rejects.toThrow(
      YtDlpError,
    );
  });

  it('errors the stream when yt-dlp fails mid-download', async () => {
    const binary = await fakeYtDlp('mid-fail', 'printf audio; sleep 0.2; echo boom >&2; exit 2');
    const stream = await streamAudio('abc123', { binary });
    await expect(text(stream)).rejects.toThrow('yt-dlp exited with 2: boom');
  });
});

describe('writeCookieFile', () => {
  it('writes a private Netscape cookie file, creating its directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'boombot-cookies-'));
    try {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const file = writeCookieFile([{ name: 'A', value: '1' }], join(dir, 'data', 'cookies.txt'))!;
      expect(await readFile(file, 'utf8')).toBe(toNetscapeCookies([{ name: 'A', value: '1' }]));
      expect((await stat(file)).mode & 0o777).toBe(0o600);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('removes a file left from an earlier run when there are no cookies', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'boombot-cookies-'));
    try {
      const file = join(dir, 'cookies.txt');
      await writeFile(file, 'stale');
      expect(writeCookieFile(null, file)).toBeNull();
      await expect(stat(file)).rejects.toThrow(/ENOENT/);
      expect(writeCookieFile([], file)).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('toNetscapeCookies', () => {
  it('converts cookies, defaulting missing fields to youtube.com', () => {
    expect(
      toNetscapeCookies([
        { name: 'SID', value: 'abc', domain: '.youtube.com', expirationDate: 1791491905.5 },
        { name: 'X', value: '1', domain: 'www.youtube.com', path: '/p', secure: false },
        { name: 'A', value: '1' },
      ]),
    ).toBe(
      '# Netscape HTTP Cookie File\n' +
        '.youtube.com\tTRUE\t/\tTRUE\t1791491905\tSID\tabc\n' +
        'www.youtube.com\tFALSE\t/p\tFALSE\t0\tX\t1\n' +
        '.youtube.com\tTRUE\t/\tTRUE\t0\tA\t1\n',
    );
  });
});
