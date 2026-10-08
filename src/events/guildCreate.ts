import type { Guild } from 'discord.js';
import type { BoomBot } from '../bot.js';

export function onGuildCreate(bot: BoomBot, guild: Guild): Promise<void> {
  bot.guilds.ensure(guild.id);
  bot.updatePresence();
  console.log(`New guild: ${guild.name}`);
  return Promise.resolve();
}
