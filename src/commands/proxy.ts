import { SlashCommandBuilder } from 'discord.js';
import { saveProxy } from '../config.js';
import { PermissionLevel, requirePermission } from './guards.js';
import type { Command } from './types.js';

const PROTOCOL = 'https?:\\/\\/';
const DOMAIN = '(?!-)([a-zA-Z0-9-]{1,63}(?<!-)\\.)+[a-zA-Z]{2,}';
const OCTET = '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
const IP_ADDRESS = `${OCTET}\\.${OCTET}\\.${OCTET}\\.${OCTET}`;
const PORT = ':\\d{1,5}';
export const PROXY_REGEX = new RegExp(`^(${PROTOCOL})((${DOMAIN})|(${IP_ADDRESS}))(${PORT})$`);

export const proxy: Command = {
  data: new SlashCommandBuilder()
    .setName('proxy')
    .setDescription('Change the YouTube proxy (Bot Owner Only)')
    .addStringOption((option) =>
      option
        .setName('proxy-link')
        .setDescription('New proxy (or "off" to disable proxy)')
        .setRequired(true),
    ),
  preconditions: [requirePermission(PermissionLevel.Owner)],
  async execute({ interaction, bot, notify }) {
    const input = interaction.options.getString('proxy-link', true).trim();
    const address = input === 'off' ? null : input;

    if (address !== null && !PROXY_REGEX.test(address)) {
      await notify('Invalid proxy, expected e.g. http://127.0.0.1:8080', 'error');
      return;
    }

    bot.youtube.setProxy(address);
    await saveProxy(address);
    await notify('Proxy changed!', 'success');
  },
};
