import { fileURLToPath } from 'node:url';
import {
  AttachmentBuilder,
  EmbedBuilder,
  type APIEmbedField,
  type GuildMember,
  type MessageCreateOptions,
} from 'discord.js';

export const Colors = {
  default: 0x351c75,
  success: 0x66bb69,
  error: 0xef5250,
  info: 0x03a8f4,
} as const;

export type Tone = keyof typeof Colors;

const ICON_NAME = 'icon.jpg';
const ICON_PATH = fileURLToPath(new URL('../../icon.jpg', import.meta.url));

export type MessagePayload = Pick<MessageCreateOptions, 'embeds' | 'files'>;

/**
 * A simple coloured notification
 */
export function notice(text: string, tone: Tone): MessagePayload {
  return {
    embeds: [new EmbedBuilder().setDescription(text).setColor(Colors[tone]).setTimestamp()],
  };
}

export interface CardOptions {
  header: string;
  body: string | APIEmbedField[];
  tone: Tone;
  member: GuildMember;
  title?: string;
  url?: string;
  thumbnail?: string;
}

/**
 * A branded embed with the bot icon as author and the requesting member in the footer
 */
export function card({
  header,
  body,
  tone,
  member,
  title,
  url,
  thumbnail,
}: CardOptions): MessagePayload {
  const embed = new EmbedBuilder()
    .setColor(Colors[tone])
    .setTimestamp()
    .setAuthor({ name: header, iconURL: `attachment://${ICON_NAME}` })
    .setFooter({ text: member.displayName, iconURL: member.user.displayAvatarURL() });

  if (typeof body === 'string') embed.setDescription(body);
  else embed.setFields(body);
  if (title) embed.setTitle(title);
  if (url) embed.setURL(url);
  if (thumbnail) embed.setThumbnail(thumbnail);

  return { embeds: [embed], files: [new AttachmentBuilder(ICON_PATH, { name: ICON_NAME })] };
}
