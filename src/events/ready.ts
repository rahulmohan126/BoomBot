import type { Client } from 'discord.js';
import type { BoomBot } from '../bot.js';
import { commands } from '../commands/index.js';

export async function onReady(bot: BoomBot, client: Client<true>): Promise<void> {
  for (const guild of client.guilds.cache.values()) bot.guilds.ensure(guild.id);
  bot.updatePresence();

  await client.application.commands.set(commands.map((command) => command.data.toJSON()));
  console.log(`———— ${commands.length} Commands Registered! ————`);

  console.log('ACTIVE SERVERS:');
  for (const guild of client.guilds.cache.values()) console.log(`${guild.id} | ${guild.name}`);
  console.log(
    `\nReady to begin! Serving in ${client.guilds.cache.size} servers. ` +
      `Startup time: ${Date.now() - bot.startedAt}ms`,
  );
}
