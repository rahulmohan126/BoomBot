import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { GuildStore, isVoiceChannelAllowed } from '../src/guilds/GuildStore.js';

let path: string;

beforeEach(async () => {
  path = join(await mkdtemp(join(tmpdir(), 'boombot-guilds-')), 'data', 'guild.json');
});

describe('GuildStore', () => {
  it('loads the legacy guild.json format', async () => {
    const legacy = { prefix: '!', textChannel: '1', voiceChannel: '2', dj: '3', instant: false };
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, JSON.stringify({ guild1: legacy }));

    const store = new GuildStore(path, '.');
    await store.load();
    expect(store.get('guild1')).toEqual(legacy);
  });

  it('creates and persists defaults for new guilds', async () => {
    const store = new GuildStore(path, '?');
    await store.load();

    const settings = store.ensure('guild2');
    expect(settings).toEqual({
      prefix: '?',
      textChannel: '',
      voiceChannel: '',
      dj: '',
      instant: true,
    });

    await store.save();
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({ guild2: settings });
  });

  it('returns the same settings object on repeated calls', () => {
    const store = new GuildStore(path, '.');
    expect(store.ensure('g')).toBe(store.ensure('g'));
  });
});

describe('isVoiceChannelAllowed', () => {
  const base = { prefix: '.', textChannel: '', dj: '', instant: true };

  it('allows any channel when unrestricted', () => {
    expect(isVoiceChannelAllowed({ ...base, voiceChannel: '' }, '123')).toBe(true);
  });

  it('only allows the configured channel', () => {
    expect(isVoiceChannelAllowed({ ...base, voiceChannel: '123' }, '123')).toBe(true);
    expect(isVoiceChannelAllowed({ ...base, voiceChannel: '123' }, '456')).toBe(false);
  });
});
