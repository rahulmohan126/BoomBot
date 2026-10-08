import { SlashCommandBuilder } from 'discord.js';
import { requireActiveQueue, requireSameVoiceChannel } from './guards.js';
import type { Command } from './types.js';

export const resume: Command = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the current song'),
  preconditions: [requireActiveQueue(), requireSameVoiceChannel],
  async execute({ queue, notify }) {
    await notify(queue.resume() ? '▶ Music resumed!' : '▶ Music is already playing', 'success');
  },
};
