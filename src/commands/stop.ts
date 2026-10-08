import { SlashCommandBuilder } from 'discord.js';
import { requireConnected, requireSameVoiceChannel } from './guards.js';
import type { Command } from './types.js';

export const stop: Command = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop all music playing'),
  // Also allowed while the bot is idling in the channel after the queue ran out
  preconditions: [requireConnected, requireSameVoiceChannel],
  async execute({ queue, notify }) {
    queue.stop();
    await notify('⏹ Music stopped!', 'success');
  },
};
