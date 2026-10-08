import { escapeMarkdown, type GuildMember } from 'discord.js';
import type { VideoDetails } from '../youtube/YouTubeService.js';

export interface Track {
  readonly id: string;
  /** Markdown-escaped title */
  readonly title: string;
  readonly url: string;
  readonly thumbnail: string;
  readonly durationMs: number;
  readonly requestedBy: GuildMember;
}

export function createTrack(video: VideoDetails, requestedBy: GuildMember): Track {
  return {
    id: video.id,
    title: escapeMarkdown(video.title),
    url: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnail: video.thumbnail,
    durationMs: video.durationMs,
    requestedBy,
  };
}
