import { SlashCommandBuilder } from 'discord.js';
import { requireActiveQueue, requireSameVoiceChannel } from './guards.js';
import type { Command } from './types.js';

export const loop: Command = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Loops the first song in queue (until skipped or stopped)'),
  preconditions: [requireActiveQueue(), requireSameVoiceChannel],
  async execute({ queue, notify }) {
    const looping = queue.toggleLoop();
    await notify(`⟲ Music ${looping ? '' : 'de'}looped!`, 'success');
  },
};
