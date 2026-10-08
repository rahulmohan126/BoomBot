import { EventEmitter } from 'node:events';
import type { Readable } from 'node:stream';
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  type AudioPlayer,
  type AudioResource,
  type VoiceConnection,
} from '@discordjs/voice';
import type { SendableChannels, VoiceBasedChannel } from 'discord.js';
import type { AudioSource, AudioStream } from '../youtube/YouTubeService.js';
import type { Track } from './Track.js';

/** How long to stay in the voice channel after the queue runs out */
export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const CONNECT_TIMEOUT_MS = 20_000;
const RECONNECT_TIMEOUT_MS = 5_000;

/** The next track's stream, loaded while the current one plays */
interface Prefetch {
  track: Track;
  load: Promise<AudioStream>;
  /** The stream errored before it was used */
  failed: boolean;
}

interface QueueEvents {
  trackStart: [track: Track];
  trackError: [track: Track, error: unknown];
}

/**
 * A guild's music session: voice connection, audio player and track queue.
 *
 * States: disconnected → connected + playing ⇄ connected + idle (auto-disconnects after
 * IDLE_TIMEOUT_MS) → disconnected.
 */
export class MusicQueue extends EventEmitter<QueueEvents> {
  textChannel: SendableChannels | null = null;
  #voiceChannelId: string | null = null;
  #connection: VoiceConnection | null = null;
  readonly #player: AudioPlayer;
  #resource: AudioResource<Track> | null = null;
  #stream: Readable | null = null;
  #prefetch: Prefetch | null = null;

  #tracks: Track[] = [];
  #current: Track | null = null;
  #looping = false;
  #paused = false;
  #skipping = false;
  /** Incremented on every track change so stale async loads can tell they were superseded */
  #generation = 0;
  #idleTimer: NodeJS.Timeout | null = null;

  constructor(
    readonly guildId: string,
    private readonly audio: AudioSource,
    private readonly idleTimeoutMs = IDLE_TIMEOUT_MS,
  ) {
    super();
    this.#player = createAudioPlayer();
    this.#player.on(AudioPlayerStatus.Idle, () => this.#onTrackFinished());
    this.#player.on('error', (err) =>
      console.error(`[${guildId}] Audio player error:`, err.message),
    );
  }

  get voiceChannelId(): string | null {
    return this.#voiceChannelId;
  }

  /** Connected to a voice channel (playing or waiting for more songs) */
  get isConnected(): boolean {
    return this.#connection !== null;
  }

  /** A track is playing (or paused/loading) */
  get isActive(): boolean {
    return this.#current !== null;
  }

  get current(): Track | null {
    return this.#current;
  }

  get upcoming(): readonly Track[] {
    return this.#tracks;
  }

  get looping(): boolean {
    return this.#looping;
  }

  get paused(): boolean {
    return this.#paused;
  }

  /** Playback position of the current track */
  get positionMs(): number {
    return this.#resource?.playbackDuration ?? 0;
  }

  /** Remaining play time of the current track plus everything queued */
  get remainingMs(): number {
    const current = this.#current ? Math.max(0, this.#current.durationMs - this.positionMs) : 0;
    return this.#tracks.reduce((total, track) => total + track.durationMs, current);
  }

  /**
   * Joins a voice channel; songs are announced in the given text channel
   */
  async connect(
    voiceChannel: VoiceBasedChannel,
    textChannel: SendableChannels | null,
  ): Promise<void> {
    if (this.#connection) return;

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    this.#connection = connection;
    this.#voiceChannelId = voiceChannel.id;
    this.textChannel = textChannel;

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      // Moving channels briefly disconnects; only give up if it doesn't recover
      Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, RECONNECT_TIMEOUT_MS),
        entersState(connection, VoiceConnectionStatus.Connecting, RECONNECT_TIMEOUT_MS),
      ]).catch(() => {
        if (this.#connection === connection) this.stop();
      });
    });
    connection.on(VoiceConnectionStatus.Destroyed, () => {
      if (this.#connection === connection) this.stop();
    });
    connection.on('error', (err) => {
      console.error(`[${this.guildId}] Voice connection error:`, err);
      if (this.#connection === connection) this.stop();
    });
    connection.subscribe(this.#player);

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, CONNECT_TIMEOUT_MS);
    } catch (err) {
      if (this.#connection === connection) this.stop();
      throw err;
    }
  }

  /**
   * Adds tracks to the end of the queue, starting playback if nothing is playing
   */
  enqueue(...tracks: Track[]): void {
    this.#tracks.push(...tracks);
    if (!this.#current) void this.#playNext();
    else if (this.#resource) this.#startPrefetch();
  }

  /**
   * Removes the track at a (zero-based) queue position
   */
  remove(index: number): Track | null {
    if (!Number.isInteger(index) || index < 0 || index >= this.#tracks.length) return null;
    const removed = this.#tracks.splice(index, 1)[0] ?? null;
    if (index === 0 && this.#resource) this.#startPrefetch();
    return removed;
  }

  /**
   * Skips the current track (also ends looping)
   */
  skip(): void {
    if (!this.#current) return;
    this.#looping = false;
    this.#skipping = true;
    this.#player.stop(true);
  }

  /** Toggles looping of the current track; returns the new state */
  toggleLoop(): boolean {
    this.#looping = !this.#looping;
    return this.#looping;
  }

  /** Returns false if already paused */
  pause(): boolean {
    if (this.#paused) return false;
    this.#paused = true;
    this.#player.pause();
    return true;
  }

  /** Returns false if already playing */
  resume(): boolean {
    if (!this.#paused) return false;
    this.#paused = false;
    this.#player.unpause();
    return true;
  }

  /**
   * Stops playback, clears the queue and leaves the voice channel
   */
  stop(): void {
    this.#generation++;
    this.#clearIdleTimer();

    const connection = this.#connection;
    this.#connection = null;
    this.#voiceChannelId = null;
    this.textChannel = null;

    this.#tracks = [];
    this.#current = null;
    this.#looping = false;
    this.#paused = false;
    this.#skipping = false;

    this.#player.stop(true);
    this.#releaseStream();
    this.#discardPrefetch();
    if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
      connection.destroy();
    }
  }

  async #playNext(): Promise<void> {
    const track = this.#tracks.shift();
    if (!track) {
      this.#current = null;
      this.#releaseStream();
      this.#discardPrefetch();
      this.#startIdleTimer();
      return;
    }
    await this.#play(track);
  }

  async #play(track: Track): Promise<void> {
    this.#clearIdleTimer();
    this.#releaseStream();
    this.#current = track;
    this.#paused = false;
    const generation = ++this.#generation;

    let audio: AudioStream;
    try {
      audio = await this.#load(track);
    } catch (err) {
      if (generation !== this.#generation) return;
      this.#failTrack(track, err);
      await this.#playNext();
      return;
    }

    const { stream, type } = audio;
    // The queue was stopped or moved on while the stream was loading
    if (generation !== this.#generation || !this.#connection) {
      stream.destroy();
      return;
    }

    stream.on('error', (err) => {
      if (generation !== this.#generation) return;
      this.#failTrack(track, err);
      this.#player.stop(true);
    });

    this.#stream = stream;
    this.#resource = createAudioResource(stream, { inputType: type, metadata: track });
    this.#player.play(this.#resource);
    this.emit('trackStart', track);
    this.#startPrefetch();
  }

  /**
   * Gets a track's stream, using the prefetched one if it's still good
   */
  async #load(track: Track): Promise<AudioStream> {
    const prefetch = this.#prefetch;
    if (prefetch?.track !== track) return this.audio.stream(track.id);

    this.#prefetch = null;
    try {
      const audio = await prefetch.load;
      if (!prefetch.failed) return audio;
      audio.stream.destroy();
    } catch {
      // It may have failed on a passing problem long ago; try once more below
    }
    return this.audio.stream(track.id);
  }

  /**
   * Starts loading the next track, replacing a prefetch of a track that's no longer next
   */
  #startPrefetch(): void {
    const next = this.#tracks[0];
    if (this.#prefetch?.track === next) return;
    this.#discardPrefetch();
    if (!next) return;

    const prefetch: Prefetch = { track: next, load: this.audio.stream(next.id), failed: false };
    prefetch.load.then(
      ({ stream }) => {
        stream.on('error', () => {
          prefetch.failed = true;
        });
      },
      () => {},
    );
    this.#prefetch = prefetch;
  }

  #discardPrefetch(): void {
    const prefetch = this.#prefetch;
    this.#prefetch = null;
    void prefetch?.load.then(
      ({ stream }) => stream.destroy(),
      () => {},
    );
  }

  #failTrack(track: Track, err: unknown): void {
    this.#looping = false;
    this.emit('trackError', track, err);
  }

  #onTrackFinished(): void {
    const finished = this.#current;
    if (!finished || this.#resource?.metadata !== finished) return;
    this.#resource = null;

    const replay = this.#looping && !this.#skipping;
    this.#skipping = false;
    void (replay ? this.#play(finished) : this.#playNext());
  }

  #releaseStream(): void {
    this.#stream?.destroy();
    this.#stream = null;
    this.#resource = null;
  }

  #startIdleTimer(): void {
    this.#clearIdleTimer();
    this.#idleTimer = setTimeout(() => this.stop(), this.idleTimeoutMs);
  }

  #clearIdleTimer(): void {
    if (this.#idleTimer) clearTimeout(this.#idleTimer);
    this.#idleTimer = null;
  }
}
