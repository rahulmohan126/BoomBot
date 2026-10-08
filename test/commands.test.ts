import { PermissionFlagsBits } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandContext } from '../src/commands/types.js';
import type { Tone } from '../src/ui/embeds.js';

vi.mock('../src/config.js', () => ({ saveProxy: vi.fn(() => Promise.resolve()) }));

const { commandsByName } = await import('../src/commands/index.js');
const { VideoUnavailableError } = await import('../src/youtube/YouTubeService.js');
const { saveProxy } = await import('../src/config.js');

interface FakeOptions {
  memberId?: string;
  memberVoice?: string | null;
  botVoice?: string | null;
  isActive?: boolean;
  isConnected?: boolean;
  allowedVoice?: string;
  botPermissions?: bigint[];
  options?: Record<string, string | number>;
  isAdmin?: boolean;
}

function fakeContext(opts: FakeOptions = {}) {
  const {
    memberId = 'member',
    memberVoice = 'voice1',
    botVoice = null,
    isActive = false,
    isConnected = botVoice !== null,
    allowedVoice = '',
    botPermissions = [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    options = {},
    isAdmin = false,
  } = opts;

  const notices: { text: string; tone: Tone }[] = [];
  const replies: unknown[] = [];

  const queue = {
    isActive,
    isConnected,
    voiceChannelId: botVoice,
    remainingMs: 0,
    connect: vi.fn(() => Promise.resolve()),
    enqueue: vi.fn(),
    skip: vi.fn(),
    stop: vi.fn(),
    remove: vi.fn((i: number) => (i === 0 ? { title: 'Song' } : null)),
    pause: vi.fn(() => true),
    resume: vi.fn(() => true),
    toggleLoop: vi.fn(() => true),
  };

  const voiceChannel = memberVoice
    ? {
        id: memberVoice,
        permissionsFor: () => ({ has: (p: bigint) => botPermissions.includes(p) }),
      }
    : null;

  const member = {
    id: memberId,
    displayName: 'tester',
    user: { displayAvatarURL: () => 'https://cdn.example/avatar.png' },
    guild: { ownerId: 'owner' },
    permissions: { has: () => isAdmin },
    roles: { cache: { has: () => false } },
    voice: { channel: voiceChannel, channelId: memberVoice },
  };

  const youtube = { resolve: vi.fn(), setProxy: vi.fn() };

  const ctx = {
    interaction: {
      options: {
        getString: (name: string) => options[name] ?? null,
        getInteger: (name: string) => options[name] ?? null,
      },
      guild: { members: { me: {} } },
      channel: { isSendable: () => true, send: vi.fn() },
      deferReply: vi.fn(() => Promise.resolve()),
    },
    member,
    bot: { config: { ownerId: 'botOwner' }, youtube },
    settings: { prefix: '.', textChannel: '', voiceChannel: allowedVoice, dj: '', instant: true },
    queue,
    reply: (payload: unknown) => {
      replies.push(payload);
      return Promise.resolve();
    },
    notify: (text: string, tone: Tone) => {
      notices.push({ text, tone });
      return Promise.resolve();
    },
  } as unknown as CommandContext;

  return { ctx, queue, youtube, notices, replies };
}

/** Runs a command the way interactionCreate does: preconditions first */
async function run(name: string, ctx: CommandContext) {
  const command = commandsByName.get(name)!;
  for (const precondition of command.preconditions ?? []) {
    const error = precondition(ctx);
    if (error) return ctx.notify(error, 'error');
  }
  return command.execute(ctx);
}

const video = {
  id: 'dQw4w9WgXcQ',
  title: 'Song *one*',
  durationMs: 212_000,
  thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
};

describe('command registry', () => {
  it('registers every slash command with the original names and options', () => {
    const json = [...commandsByName.values()].map((c) => c.data.toJSON());
    expect(json.map((c) => c.name).sort()).toEqual(
      [
        'loop',
        'np',
        'pause',
        'ping',
        'play',
        'proxy',
        'queue',
        'remove',
        'resume',
        'skip',
        'stop',
        'uptime',
      ].sort(),
    );
    expect(json.find((c) => c.name === 'play')?.options?.[0]).toMatchObject({
      name: 'query',
      required: true,
    });
    expect(json.find((c) => c.name === 'remove')?.options?.[0]).toMatchObject({
      name: 'position',
      type: 4,
    });
    expect(json.find((c) => c.name === 'proxy')?.options?.[0]).toMatchObject({
      name: 'proxy-link',
    });
  });
});

describe('music control preconditions', () => {
  it.each(['pause', 'resume', 'loop', 'remove', 'np', 'queue'])(
    '%s requires something playing',
    async (name) => {
      const { ctx, notices } = fakeContext();
      await run(name, ctx);
      expect(notices).toEqual([
        { text: 'There is no music playing at the moment...', tone: 'error' },
      ]);
    },
  );

  it('skip has its own nothing-playing message', async () => {
    const { ctx, notices } = fakeContext();
    await run('skip', ctx);
    expect(notices[0]?.text).toBe('There is nothing playing that I could skip for you.');
  });

  it.each(['pause', 'resume', 'loop', 'skip', 'stop', 'remove'])(
    '%s requires being in the bot voice channel',
    async (name) => {
      const { ctx, notices } = fakeContext({
        isActive: true,
        botVoice: 'voice1',
        memberVoice: 'voice2',
      });
      await run(name, ctx);
      expect(notices).toEqual([
        { text: 'Join the voice channel with the bot to use that command', tone: 'error' },
      ]);
    },
  );

  it('stop works while the bot idles in the channel', async () => {
    const { ctx, queue, notices } = fakeContext({ isActive: false, botVoice: 'voice1' });
    await run('stop', ctx);
    expect(queue.stop).toHaveBeenCalled();
    expect(notices).toEqual([{ text: '⏹ Music stopped!', tone: 'success' }]);
  });
});

describe('music controls', () => {
  const active = { isActive: true, botVoice: 'voice1' };

  it('skip', async () => {
    const { ctx, queue, notices } = fakeContext(active);
    await run('skip', ctx);
    expect(queue.skip).toHaveBeenCalled();
    expect(notices[0]).toEqual({ text: '▶︎▶︎ Music skipped!', tone: 'success' });
  });

  it('pause / already paused', async () => {
    const { ctx, queue, notices } = fakeContext(active);
    await run('pause', ctx);
    queue.pause.mockReturnValue(false);
    await run('pause', ctx);
    expect(notices.map((n) => n.text)).toEqual(['⏸ Music paused!', '⏸ Music already paused!']);
  });

  it('resume / already playing', async () => {
    const { ctx, queue, notices } = fakeContext(active);
    await run('resume', ctx);
    queue.resume.mockReturnValue(false);
    await run('resume', ctx);
    expect(notices.map((n) => n.text)).toEqual(['▶ Music resumed!', '▶ Music is already playing']);
  });

  it('loop toggles', async () => {
    const { ctx, queue, notices } = fakeContext(active);
    await run('loop', ctx);
    queue.toggleLoop.mockReturnValue(false);
    await run('loop', ctx);
    expect(notices.map((n) => n.text)).toEqual(['⟲ Music looped!', '⟲ Music delooped!']);
  });

  it('remove converts the 1-based position', async () => {
    const { ctx, queue, notices } = fakeContext({ ...active, options: { position: 1 } });
    await run('remove', ctx);
    expect(queue.remove).toHaveBeenCalledWith(0);
    expect(notices[0]).toEqual({ text: 'Removed "Song" from the queue.', tone: 'success' });
  });

  it('remove rejects invalid positions', async () => {
    const { ctx, notices } = fakeContext({ ...active, options: { position: 9 } });
    await run('remove', ctx);
    expect(notices[0]).toEqual({
      text: "Sorry, that isn't a valid position in the queue.",
      tone: 'error',
    });
  });
});

describe('play', () => {
  it.each<[string, FakeOptions, string]>([
    [
      'no voice channel',
      { memberVoice: null },
      'Voice channel required in order to start playing music',
    ],
    [
      'a different channel from the bot',
      { botVoice: 'voice2' },
      'You must be in the same voice channel as the bot to play music',
    ],
    ['a restricted channel', { allowedVoice: 'voice9' }, 'That voice channel is not permitted'],
    [
      'no Connect permission',
      { botPermissions: [PermissionFlagsBits.Speak] },
      'I cannot connect to your voice channel, make sure I have the proper permissions!',
    ],
    [
      'no Speak permission',
      { botPermissions: [PermissionFlagsBits.Connect] },
      'I cannot speak in this voice channel, make sure I have the proper permissions!',
    ],
  ])('rejects %s', async (_, opts, message) => {
    const { ctx, notices, youtube } = fakeContext({ ...opts, options: { query: 'song' } });
    await run('play', ctx);
    expect(notices).toEqual([{ text: message, tone: 'error' }]);
    expect(youtube.resolve).not.toHaveBeenCalled();
  });

  it.each<[string, unknown, string]>([
    ['livestreams', new VideoUnavailableError('x', 'live'), 'Cannot play livestreams'],
    [
      'private videos',
      new VideoUnavailableError('x', 'unavailable'),
      'Video is private or unavailable',
    ],
    ['lookup failures', new Error('network'), '🆘 I could not obtain any search results.'],
  ])('reports %s', async (_, error, message) => {
    const { ctx, notices, youtube, queue } = fakeContext({ options: { query: 'song' } });
    youtube.resolve.mockRejectedValue(error);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await run('play', ctx);
    expect(notices).toEqual([{ text: message, tone: 'error' }]);
    expect(queue.connect).not.toHaveBeenCalled();
  });

  it('reports empty search results', async () => {
    const { ctx, notices, youtube } = fakeContext({ options: { query: 'asdfghjkl' } });
    youtube.resolve.mockResolvedValue({ kind: 'none' });
    await run('play', ctx);
    expect(notices[0]?.text).toBe('🆘 I could not obtain any search results.');
  });

  it('joins and queues a single video with an "Added to queue" card', async () => {
    const { ctx, queue, replies, youtube } = fakeContext({ options: { query: 'song' } });
    youtube.resolve.mockResolvedValue({ kind: 'video', video });
    await run('play', ctx);

    expect(queue.connect).toHaveBeenCalled();
    expect(queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ id: video.id, title: 'Song \\*one\\*', durationMs: 212_000 }),
    );

    const embed = (
      replies[0] as { embeds: { toJSON(): Record<string, unknown> }[] }
    ).embeds[0]!.toJSON();
    expect(embed).toMatchObject({
      author: { name: 'Added to queue' },
      title: 'Song \\*one\\*',
      url: `https://www.youtube.com/watch?v=${video.id}`,
      fields: [
        { name: 'Duration', value: '`03:32`' },
        { name: 'Time Until Played', value: '`00:00`' },
        { name: 'Requested By', value: '`tester`' },
      ],
    });
  });

  it('queues a playlist with a single summary message', async () => {
    const { ctx, queue, notices, youtube } = fakeContext({ options: { query: 'list' } });
    youtube.resolve.mockResolvedValue({
      kind: 'playlist',
      title: 'Mix',
      videos: [video, { ...video, id: 'b' }],
    });
    await run('play', ctx);

    expect(queue.enqueue).toHaveBeenCalledTimes(1);
    expect(queue.enqueue.mock.calls[0]).toHaveLength(2);
    expect(notices).toEqual([
      { text: '✅ Playlist: **Mix** has been added to the queue!', tone: 'success' },
    ]);
  });

  it('reports a failure to join the voice channel', async () => {
    const { ctx, queue, notices, youtube } = fakeContext({ options: { query: 'song' } });
    youtube.resolve.mockResolvedValue({ kind: 'video', video });
    queue.connect.mockRejectedValue(new Error('timeout'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await run('play', ctx);
    expect(notices).toEqual([{ text: 'Could not join voice channel', tone: 'error' }]);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
});

describe('proxy', () => {
  beforeEach(() => vi.mocked(saveProxy).mockClear());

  it('is restricted to the bot or guild owner', async () => {
    const { ctx, notices, youtube } = fakeContext({
      isAdmin: true,
      options: { 'proxy-link': 'off' },
    });
    await run('proxy', ctx);
    expect(notices[0]?.tone).toBe('error');
    expect(youtube.setProxy).not.toHaveBeenCalled();
  });

  it('sets and persists a valid proxy', async () => {
    const { ctx, notices, youtube } = fakeContext({
      memberId: 'botOwner',
      options: { 'proxy-link': 'http://10.0.0.1:8080' },
    });
    await run('proxy', ctx);
    expect(youtube.setProxy).toHaveBeenCalledWith('http://10.0.0.1:8080');
    expect(saveProxy).toHaveBeenCalledWith('http://10.0.0.1:8080');
    expect(notices).toEqual([{ text: 'Proxy changed!', tone: 'success' }]);
  });

  it('disables the proxy with "off"', async () => {
    const { ctx, youtube } = fakeContext({ memberId: 'owner', options: { 'proxy-link': 'off' } });
    await run('proxy', ctx);
    expect(youtube.setProxy).toHaveBeenCalledWith(null);
    expect(saveProxy).toHaveBeenCalledWith(null);
  });

  it('rejects malformed proxies', async () => {
    const { ctx, youtube, notices } = fakeContext({
      memberId: 'owner',
      options: { 'proxy-link': 'not a proxy' },
    });
    await run('proxy', ctx);
    expect(youtube.setProxy).not.toHaveBeenCalled();
    expect(notices[0]?.tone).toBe('error');
  });
});
