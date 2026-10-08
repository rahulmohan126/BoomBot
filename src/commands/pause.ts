import { SlashCommandBuilder } from 'discord.js';
import { requireActiveQueue, requireSameVoiceChannel } from './guards.js';
import type { Command } from './types.js';

export const pause: Command = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current song'),
  preconditions: [requireActiveQueue(), requireSameVoiceChannel],
  async execute({ queue, notify }) {
    await notify(queue.pause() ? '⏸ Music paused!' : '⏸ Music already paused!', 'success');
  },
};
