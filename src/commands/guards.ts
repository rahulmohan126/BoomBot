import { PermissionLevel, permissionLevel } from '../guilds/permissions.js';
import type { Precondition } from './types.js';

export const NOTHING_PLAYING = 'There is no music playing at the moment...';

/** A song must be playing (or paused) */
export const requireActiveQueue =
  (message = NOTHING_PLAYING): Precondition =>
  ({ queue }) =>
    queue.isActive ? null : message;

/** The bot must be in a voice channel (playing or waiting for more songs) */
export const requireConnected: Precondition = ({ queue }) =>
  queue.isConnected ? null : NOTHING_PLAYING;

/** The member must be in the same voice channel as the bot */
export const requireSameVoiceChannel: Precondition = ({ member, queue }) =>
  member.voice.channelId !== null && member.voice.channelId === queue.voiceChannelId
    ? null
    : 'Join the voice channel with the bot to use that command';

/** The member must have at least the given permission level */
export const requirePermission =
  (level: PermissionLevel): Precondition =>
  ({ member, settings, bot }) =>
    permissionLevel(member, settings, bot.config.ownerId) <= level
      ? null
      : 'You do not have permission to use that command';

export { PermissionLevel };
