import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadConfig, saveProxy } from '../src/config.js';

let dir: string;
let settingsPath: string;
let cookiesPath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'boombot-config-'));
  settingsPath = join(dir, 'settings.json');
  cookiesPath = join(dir, 'cookies.json');
});

const writeJson = (path: string, value: unknown) => writeFile(path, JSON.stringify(value));

describe('loadConfig', () => {
  it('reads a legacy settings file', async () => {
    await writeJson(settingsPath, {
      BOTID: '1',
      OWNERID: '2',
      PREFIX: '?',
      TOKEN: 'token',
      GOOGLE_API_KEY: 'unused',
      PROXY: 'http://127.0.0.1:8080',
    });
    await writeJson(cookiesPath, [{ name: 'SID', value: 'abc', domain: '.youtube.com' }]);

    await expect(loadConfig(settingsPath, cookiesPath)).resolves.toEqual({
      token: 'token',
      ownerId: '2',
      defaultPrefix: '?',
      proxy: 'http://127.0.0.1:8080',
      cookies: [{ name: 'SID', value: 'abc', domain: '.youtube.com' }],
    });
  });

  it('treats a missing cookies file and empty proxy as unset', async () => {
    await writeJson(settingsPath, { TOKEN: 'token', PROXY: '' });

    const config = await loadConfig(settingsPath, cookiesPath);
    expect(config.cookies).toBeNull();
    expect(config.proxy).toBeNull();
    expect(config.defaultPrefix).toBe('.');
  });

  it('reports missing required settings', async () => {
    await writeJson(settingsPath, { OWNERID: '2' });
    await expect(loadConfig(settingsPath, cookiesPath)).rejects.toThrow(/TOKEN/);
  });

  it('normalizes a Cookie header string to cookie objects', async () => {
    await writeJson(settingsPath, { TOKEN: 'token' });
    await writeJson(cookiesPath, 'A=1; B=x=y');

    const config = await loadConfig(settingsPath, cookiesPath);
    expect(config.cookies).toEqual([
      { name: 'A', value: '1' },
      { name: 'B', value: 'x=y' },
    ]);
  });

  it('rejects malformed cookies', async () => {
    await writeJson(settingsPath, { TOKEN: 'token' });
    await writeJson(cookiesPath, [{ nope: true }]);
    await expect(loadConfig(settingsPath, cookiesPath)).rejects.toThrow(/cookies\.json/);
  });
});

describe('saveProxy', () => {
  it('updates only the PROXY key', async () => {
    await writeJson(settingsPath, { TOKEN: 'token', OWNERID: '2', PROXY: null });

    await saveProxy('http://proxy.example.com:3128', settingsPath);
    expect(JSON.parse(await readFile(settingsPath, 'utf8'))).toEqual({
      TOKEN: 'token',
      OWNERID: '2',
      PROXY: 'http://proxy.example.com:3128',
    });
  });
});
