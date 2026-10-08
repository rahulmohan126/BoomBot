import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types.js';

export const ping: Command = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Ping the bot'),
  async execute({ interaction }) {
    const start = Date.now();
    await interaction.reply('Pong!');
    await interaction.editReply(`Pong \`(${Date.now() - start}ms)\``);
  },
};
