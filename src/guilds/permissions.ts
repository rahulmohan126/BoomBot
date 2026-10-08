import { PermissionFlagsBits, type GuildMember } from 'discord.js';
import type { GuildSettings } from './GuildStore.js';

export enum PermissionLevel {
  /** Guild owner or bot owner */
  Owner = 0,
  /** Administrator or DJ role */
  Manager = 1,
  Member = 2,
}

export function permissionLevel(
  member: GuildMember,
  settings: GuildSettings,
  botOwnerId: string,
): PermissionLevel {
  if (member.id === member.guild.ownerId || member.id === botOwnerId) {
    return PermissionLevel.Owner;
  }
  if (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    (settings.dj !== '' && member.roles.cache.has(settings.dj))
  ) {
    return PermissionLevel.Manager;
  }
  return PermissionLevel.Member;
}
