import { SlashCommandBuilder } from 'discord.js';
import { requireActiveQueue, requireSameVoiceChannel } from './guards.js';
import type { Command } from './types.js';

export const skip: Command = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),
  preconditions: [
    requireActiveQueue('There is nothing playing that I could skip for you.'),
    requireSameVoiceChannel,
  ],
  async execute({ queue, notify }) {
    queue.skip();
    await notify('▶︎▶︎ Music skipped!', 'success');
  },
};
