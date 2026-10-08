import { SlashCommandBuilder } from 'discord.js';
import { formatUptime } from '../ui/format.js';
import type { Command } from './types.js';

export const uptime: Command = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('See how long the bot has been running'),
  async execute({ bot, reply }) {
    await reply(`Uptime: \`${formatUptime(Date.now() - bot.startedAt)}\``);
  },
};
