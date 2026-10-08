import { SlashCommandBuilder } from 'discord.js';
import { requireActiveQueue, requireSameVoiceChannel } from './guards.js';
import type { Command } from './types.js';

export const remove: Command = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from queue')
    .addIntegerOption((option) =>
      option
        .setName('position')
        .setDescription('Position of the song to be removed')
        .setRequired(true),
    ),
  preconditions: [requireActiveQueue(), requireSameVoiceChannel],
  async execute({ interaction, queue, notify }) {
    const removed = queue.remove(interaction.options.getInteger('position', true) - 1);
    if (removed) {
      await notify(`Removed "${removed.title}" from the queue.`, 'success');
    } else {
      await notify("Sorry, that isn't a valid position in the queue.", 'error');
    }
  },
};
