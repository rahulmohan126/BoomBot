import { SlashCommandBuilder } from 'discord.js';
import { card } from '../ui/embeds.js';
import { formatDuration, progressBar } from '../ui/format.js';
import { requireActiveQueue } from './guards.js';
import type { Command } from './types.js';

export const np: Command = {
  data: new SlashCommandBuilder().setName('np').setDescription('Check the currently playing song'),
  preconditions: [requireActiveQueue()],
  async execute({ queue, member, reply }) {
    const track = queue.current!;
    const position = queue.positionMs;

    const body = [
      `🎶 **[${track.title}](${track.url})**`,
      '',
      progressBar(position / track.durationMs),
      '',
      `**Looped:** ${queue.looping ? 'Looped' : 'Not looped'}`,
      `**Duration:** \`${formatDuration(position)} / ${formatDuration(track.durationMs)}\``,
      `**Requested By:** ${track.requestedBy.displayName}`,
    ].join('\n');

    await reply(card({ header: 'Now Playing', body, tone: 'info', member }));
  },
};
