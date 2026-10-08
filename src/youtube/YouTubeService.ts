import type { Readable } from 'node:stream';
import { demuxProbe, type StreamType } from '@discordjs/voice';
import { Innertube, YTNodes } from 'youtubei.js';
import type { Cookies } from '../config.js';
import { createProxyFetch, toCookieHeader } from './http.js';
import { parsePlaylistId, parseVideoId } from './url.js';
import { streamAudio, writeCookieFile } from './ytdlp.js';

/** Number of playlist videos whose details are fetched concurrently */
const PLAYLIST_CONCURRENCY = 5;

export interface VideoDetails {
  id: string;
  title: string;
  durationMs: number;
  thumbnail: string;
}

export type UnavailableReason = 'unavailable' | 'live';

export class VideoUnavailableError extends Error {
  constructor(
    readonly videoId: string,
    readonly reason: UnavailableReason,
  ) {
    super(`Video ${videoId} is ${reason === 'live' ? 'a livestream' : 'unavailable'}`);
    this.name = 'VideoUnavailableError';
  }
}

export type ResolveResult =
  | { kind: 'video'; video: VideoDetails }
  | { kind: 'playlist'; title: string; videos: VideoDetails[] }
  | { kind: 'none' };

export interface AudioStream {
  stream: Readable;
  /** Container/codec, so Opus can be passed to Discord without re-encoding */
  type: StreamType;
}

export interface AudioSource {
  stream(videoId: string): Promise<AudioStream>;
}

/**
 * Metadata lookups (videos, playlists, search) through youtubei.js, and audio streaming
 * through yt-dlp, which handles YouTube's stream protection (PO tokens, SABR)
 */
export class YouTubeService implements AudioSource {
  #client: Promise<Innertube> | null = null;
  /** Cookies in the file format yt-dlp reads, written once up front */
  readonly #cookieFile: string | null;

  constructor(
    private readonly cookies: Cookies | null,
    private proxy: string | null,
  ) {
    this.#cookieFile = writeCookieFile(cookies);
  }

  /**
   * Switches to a new proxy (or none); the client is recreated on next use
   */
  setProxy(proxy: string | null): void {
    this.proxy = proxy;
    this.#client = null;
  }

  /**
   * Gets the client, creating it if it doesn't exist or a previous attempt failed
   */
  client(): Promise<Innertube> {
    this.#client ??= Innertube.create({
      cookie: toCookieHeader(this.cookies),
      fetch: this.proxy ? createProxyFetch(this.proxy) : undefined,
    }).catch((err: unknown) => {
      this.#client = null;
      throw err;
    });

    return this.#client;
  }

  /**
   * Resolves a play query: playlist URL, video URL, or search terms (first result)
   */
  async resolve(query: string): Promise<ResolveResult> {
    const playlistId = parsePlaylistId(query);
    const videoId = parseVideoId(query);

    if (playlistId) {
      try {
        return { kind: 'playlist', ...(await this.getPlaylist(playlistId)) };
      } catch (err) {
        // Auto-generated lists (e.g. mixes) can't be browsed; fall back to the linked video
        if (!videoId) throw err;
      }
    }

    if (videoId) {
      return { kind: 'video', video: await this.getVideo(videoId) };
    }

    const searchResultId = await this.search(query);
    return searchResultId
      ? { kind: 'video', video: await this.getVideo(searchResultId) }
      : { kind: 'none' };
  }

  async getVideo(videoId: string): Promise<VideoDetails> {
    const yt = await this.client();
    const info = await yt.getBasicInfo(videoId);
    const details = info.basic_info;

    if (info.playability_status?.status !== 'OK' || details.is_private) {
      throw new VideoUnavailableError(videoId, 'unavailable');
    }
    if (details.is_live || details.is_upcoming || !details.duration) {
      throw new VideoUnavailableError(videoId, 'live');
    }

    return {
      id: videoId,
      title: details.title ?? 'Unknown title',
      durationMs: details.duration * 1000,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
    };
  }

  /**
   * Gets a playlist's title and every playable video in it (unavailable videos are skipped)
   */
  async getPlaylist(playlistId: string): Promise<{ title: string; videos: VideoDetails[] }> {
    const yt = await this.client();
    let page = await yt.getPlaylist(playlistId);
    const title = page.info.title ?? 'Untitled playlist';

    const ids: string[] = [];
    for (;;) {
      for (const item of page.items) {
        if (item.is(YTNodes.PlaylistVideo)) ids.push(item.id);
        else if (item.is(YTNodes.LockupView) && item.content_type === 'VIDEO')
          ids.push(item.content_id);
      }
      if (!page.has_continuation) break;
      page = await page.getContinuation();
    }

    const videos = await mapConcurrent(ids, PLAYLIST_CONCURRENCY, (id) =>
      this.getVideo(id).catch(() => null),
    );
    return { title, videos: videos.filter((video) => video !== null) };
  }

  /**
   * Returns the ID of the first video search result, if any
   */
  async search(query: string): Promise<string | null> {
    const yt = await this.client();
    const results = await yt.search(query, { type: 'video' });
    return results.results.firstOfType(YTNodes.Video)?.video_id ?? null;
  }

  /**
   * Streams the best available audio for a video, preferring Opus
   */
  async stream(videoId: string): Promise<AudioStream> {
    const audio = await streamAudio(videoId, { cookieFile: this.#cookieFile, proxy: this.proxy });
    try {
      return await demuxProbe(audio);
    } catch (err) {
      audio.destroy();
      throw err;
    }
  }
}

/**
 * Maps items with at most `limit` promises in flight, preserving order
 */
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
