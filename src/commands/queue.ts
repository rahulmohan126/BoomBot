import { SlashCommandBuilder } from 'discord.js';
import { card } from '../ui/embeds.js';
import { formatDuration } from '../ui/format.js';
import { requireActiveQueue } from './guards.js';
import type { Command } from './types.js';

const QUEUE_LIMIT = 20;

export const queue: Command = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Get the current queue of songs'),
  preconditions: [requireActiveQueue()],
  async execute({ queue: musicQueue, member, reply }) {
    const tracks = musicQueue.upcoming;
    const lines = tracks
      .slice(0, QUEUE_LIMIT)
      .map(
        (track, i) =>
          `**${i + 1}.** ${track.title} | \`${formatDuration(track.durationMs)}\` | ` +
          `\`Requested by ${track.requestedBy.displayName}\``,
      );

    const overflow = tracks.length - QUEUE_LIMIT;
    if (overflow > 0) lines.push('', `${overflow} more unlisted songs in queue.`);

    const body = [
      ...lines,
      '',
      `**Looped:** ${musicQueue.looping ? 'Looped' : 'Not looped'}`,
      `**Now playing:** ${musicQueue.current!.title}`,
      `**Time Left in Queue:** ${formatDuration(musicQueue.remainingMs)}`,
    ].join('\n');

    await reply(card({ header: 'Song Queue', body, tone: 'info', member }));
  },
};
