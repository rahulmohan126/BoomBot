import { PassThrough, type Readable } from 'node:stream';
import type { GuildMember, SendableChannels, VoiceBasedChannel } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { AudioStream } from '../src/youtube/YouTubeService.js';

vi.mock('@discordjs/voice', async () => {
  // vi.mock is hoisted above imports, so load dependencies inside the factory
  const { EventEmitter } = await import('node:events');

  class FakePlayer extends EventEmitter {
    resource: unknown = null;
    play(resource: unknown) {
      this.resource = resource;
    }
    stop() {
      if (!this.resource) return false;
      this.resource = null;
      this.emit('idle');
      return true;
    }
    pause() {
      return true;
    }
    unpause() {
      return true;
    }
  }

  class FakeConnection extends EventEmitter {
    state = { status: 'ready' };
    subscribe() {}
    destroy() {
      this.state = { status: 'destroyed' };
      this.emit('destroyed');
    }
  }

  const players: FakePlayer[] = [];

  return {
    __players: players,
    AudioPlayerStatus: { Idle: 'idle' },
    VoiceConnectionStatus: {
      Ready: 'ready',
      Disconnected: 'disconnected',
      Destroyed: 'destroyed',
      Signalling: 'signalling',
      Connecting: 'connecting',
    },
    createAudioPlayer: () => {
      const created = new FakePlayer();
      players.push(created);
      return created;
    },
    StreamType: { Arbitrary: 'arbitrary', WebmOpus: 'webm/opus' },
    createAudioResource: (
      stream: Readable,
      options: { inputType: unknown; metadata: unknown },
    ) => ({
      stream,
      inputType: options.inputType,
      metadata: options.metadata,
      playbackDuration: 0,
    }),
    joinVoiceChannel: () => new FakeConnection(),
    entersState: () => Promise.resolve(),
  };
});

const { MusicQueue } = await import('../src/music/MusicQueue.js');
const { __players: players } = (await import('@discordjs/voice')) as unknown as {
  __players: { resource: unknown; stop(): boolean }[];
};
type Queue = InstanceType<typeof MusicQueue>;

const member = { displayName: 'tester' } as GuildMember;
const voiceChannel = {
  id: 'voice1',
  guild: { id: 'guild1', voiceAdapterCreator: () => ({}) },
} as unknown as VoiceBasedChannel;
const textChannel = { send: vi.fn() } as unknown as SendableChannels;

const track = (id: string, durationMs = 60_000) => ({
  id,
  title: id,
  url: `https://www.youtube.com/watch?v=${id}`,
  thumbnail: '',
  durationMs,
  requestedBy: member,
});

const loaded = (stream: Readable = new PassThrough()) =>
  Promise.resolve<AudioStream>({ stream, type: 'arbitrary' as AudioStream['type'] });

/** Lets pending stream loads settle */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('MusicQueue', () => {
  let audio: { stream: Mock<(videoId: string) => Promise<AudioStream>> };
  /** Every stream handed out, in order */
  let streams: PassThrough[];
  let queue: Queue;
  let started: string[];
  let failed: string[];

  beforeEach(async () => {
    streams = [];
    audio = {
      stream: vi.fn(() => {
        const stream = new PassThrough();
        streams.push(stream);
        return loaded(stream);
      }),
    };
    queue = new MusicQueue('guild1', audio, 1_000);
    started = [];
    failed = [];
    queue.on('trackStart', (t) => started.push(t.id));
    queue.on('trackError', (t) => failed.push(t.id));
    await queue.connect(voiceChannel, textChannel);
  });

  afterEach(() => {
    queue.stop();
    vi.useRealTimers();
  });

  it('starts playing the first enqueued track', async () => {
    queue.enqueue(track('a'), track('b'));
    await flush();

    expect(started).toEqual(['a']);
    expect(queue.current?.id).toBe('a');
    expect(queue.upcoming.map((t) => t.id)).toEqual(['b']);
    expect(queue.isActive).toBe(true);
  });

  it('advances through the queue on skip', async () => {
    queue.enqueue(track('a'), track('b'));
    await flush();

    queue.skip();
    await flush();
    expect(started).toEqual(['a', 'b']);

    queue.skip();
    await flush();
    expect(queue.isActive).toBe(false);
    expect(queue.isConnected).toBe(true);
  });

  it('replays the current track while looping, and skip ends the loop', async () => {
    queue.enqueue(track('a'), track('b'));
    await flush();
    expect(queue.toggleLoop()).toBe(true);

    // Simulate the track finishing naturally
    players.at(-1)!.stop();
    await flush();
    expect(started).toEqual(['a', 'a']);
    expect(queue.upcoming).toHaveLength(1);

    queue.skip();
    await flush();
    expect(started).toEqual(['a', 'a', 'b']);
    expect(queue.looping).toBe(false);
  });

  it('reports a track that fails to load and moves on', async () => {
    audio.stream.mockImplementationOnce(() => Promise.reject(new Error('unplayable')));
    queue.toggleLoop();
    queue.enqueue(track('bad'), track('good'));
    await flush();

    expect(failed).toEqual(['bad']);
    expect(started).toEqual(['good']);
    expect(queue.looping).toBe(false);
  });

  it('reports a stream that errors mid-playback and moves on', async () => {
    const stream = new PassThrough();
    audio.stream.mockImplementationOnce(() => loaded(stream));
    queue.enqueue(track('a'), track('b'));
    await flush();

    stream.destroy(new Error('connection reset'));
    await flush();
    expect(failed).toEqual(['a']);
    expect(started).toEqual(['a', 'b']);
  });

  it('passes the stream type through to the audio resource', async () => {
    const stream = new PassThrough();
    audio.stream.mockImplementationOnce(() =>
      Promise.resolve({ stream, type: 'webm/opus' as AudioStream['type'] }),
    );
    queue.enqueue(track('a'));
    await flush();
    expect(players.at(-1)!.resource).toMatchObject({ stream, inputType: 'webm/opus' });
  });

  it('loads the next track while the current one plays, and skip uses it', async () => {
    queue.enqueue(track('a'), track('b'));
    await flush();
    expect(audio.stream.mock.calls).toEqual([['a'], ['b']]);

    queue.skip();
    await flush();
    expect(started).toEqual(['a', 'b']);
    expect(audio.stream).toHaveBeenCalledTimes(2);
    expect(streams[1]!.destroyed).toBe(false);
  });

  it('prefetches a track queued while one is playing', async () => {
    queue.enqueue(track('a'));
    await flush();
    queue.enqueue(track('b'), track('c'));
    await flush();
    expect(audio.stream.mock.calls).toEqual([['a'], ['b']]);
  });

  it('replaces the prefetch when the next track is removed', async () => {
    queue.enqueue(track('a'), track('b'), track('c'));
    await flush();

    queue.remove(0);
    await flush();
    expect(streams[1]!.destroyed).toBe(true);
    expect(audio.stream.mock.calls).toEqual([['a'], ['b'], ['c']]);

    queue.skip();
    await flush();
    expect(started).toEqual(['a', 'c']);
    expect(audio.stream).toHaveBeenCalledTimes(3);
  });

  it('keeps the prefetch while looping', async () => {
    queue.enqueue(track('a'), track('b'));
    await flush();
    queue.toggleLoop();

    players.at(-1)!.stop();
    await flush();
    expect(audio.stream.mock.calls).toEqual([['a'], ['b'], ['a']]);

    queue.skip();
    await flush();
    expect(started).toEqual(['a', 'a', 'b']);
    expect(audio.stream).toHaveBeenCalledTimes(3);
  });

  it('destroys a prefetch that finishes loading after stop', async () => {
    let resolveNext!: (audio: AudioStream) => void;
    audio.stream
      .mockImplementationOnce(() => loaded())
      .mockImplementationOnce(() => new Promise((resolve) => (resolveNext = resolve)));
    queue.enqueue(track('a'), track('b'));
    await flush();
    queue.stop();

    const stream = new PassThrough();
    resolveNext({ stream, type: 'arbitrary' as AudioStream['type'] });
    await flush();
    expect(stream.destroyed).toBe(true);
  });

  it('reloads a prefetched stream that errored before it was played', async () => {
    queue.enqueue(track('a'), track('b'));
    await flush();

    streams[1]!.destroy(new Error('connection reset'));
    await flush();
    queue.skip();
    await flush();

    expect(failed).toEqual([]);
    expect(started).toEqual(['a', 'b']);
    expect(audio.stream.mock.calls).toEqual([['a'], ['b'], ['b']]);
    expect(players.at(-1)!.resource).toMatchObject({ stream: streams[2] });
  });

  it('retries a failed prefetch once before reporting the track', async () => {
    audio.stream
      .mockImplementationOnce(() => loaded())
      .mockImplementationOnce(() => Promise.reject(new Error('blocked')))
      .mockImplementationOnce(() => Promise.reject(new Error('still blocked')));
    queue.enqueue(track('a'), track('b'), track('c'));
    await flush();

    queue.skip();
    await flush();
    expect(audio.stream.mock.calls.slice(0, 3)).toEqual([['a'], ['b'], ['b']]);
    expect(failed).toEqual(['b']);
    expect(started).toEqual(['a', 'c']);
  });

  it('removes tracks by position', async () => {
    queue.enqueue(track('a'), track('b'), track('c'));
    await flush();

    expect(queue.remove(5)).toBeNull();
    expect(queue.remove(-1)).toBeNull();
    expect(queue.remove(1)?.id).toBe('c');
    expect(queue.upcoming.map((t) => t.id)).toEqual(['b']);
  });

  it('tracks pause state', async () => {
    queue.enqueue(track('a'));
    await flush();

    expect(queue.pause()).toBe(true);
    expect(queue.pause()).toBe(false);
    expect(queue.resume()).toBe(true);
    expect(queue.resume()).toBe(false);
  });

  it('computes the remaining time of the queue', async () => {
    queue.enqueue(track('a', 60_000), track('b', 30_000));
    await flush();
    expect(queue.remainingMs).toBe(90_000);
  });

  it('stop clears everything and leaves the channel', async () => {
    queue.enqueue(track('a'), track('b'));
    await flush();

    queue.stop();
    expect(queue.isConnected).toBe(false);
    expect(queue.isActive).toBe(false);
    expect(queue.upcoming).toHaveLength(0);
    expect(queue.textChannel).toBeNull();
  });

  it('does not start a track that finished loading after stop', async () => {
    let resolveStream!: (audio: AudioStream) => void;
    audio.stream.mockImplementationOnce(() => new Promise((resolve) => (resolveStream = resolve)));
    queue.enqueue(track('slow'));
    queue.stop();

    const stream = new PassThrough();
    resolveStream({ stream, type: 'arbitrary' as AudioStream['type'] });
    await flush();
    expect(started).toEqual([]);
    expect(stream.destroyed).toBe(true);
  });

  it('disconnects after idling with an empty queue', async () => {
    vi.useFakeTimers();
    queue.enqueue(track('a'));
    await vi.waitFor(() => expect(started).toEqual(['a']));

    queue.skip();
    await vi.advanceTimersByTimeAsync(999);
    expect(queue.isConnected).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    expect(queue.isConnected).toBe(false);
  });

  it('cancels the idle disconnect when a new track is queued', async () => {
    vi.useFakeTimers();
    queue.enqueue(track('a'));
    await vi.waitFor(() => expect(started).toEqual(['a']));
    queue.skip();
    await vi.advanceTimersByTimeAsync(500);

    queue.enqueue(track('b'));
    await vi.advanceTimersByTimeAsync(1_000);
    expect(queue.isConnected).toBe(true);
    expect(queue.current?.id).toBe('b');
  });
});
