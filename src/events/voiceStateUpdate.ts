import type { VoiceState } from 'discord.js';
import type { BoomBot } from '../bot.js';
import { notice } from '../ui/embeds.js';

/**
 * Leaves the voice channel once everyone else has left it
 */
export async function onVoiceStateUpdate(
  bot: BoomBot,
  oldState: VoiceState,
  newState: VoiceState,
): Promise<void> {
  const queue = bot.queues.find(newState.guild.id);
  const channelId = queue?.voiceChannelId;
  if (
    !queue ||
    !channelId ||
    (oldState.channelId !== channelId && newState.channelId !== channelId)
  )
    return;

  const channel = newState.guild.channels.cache.get(channelId);
  if (!channel?.isVoiceBased()) return;

  const listeners = channel.members.filter((member) => !member.user.bot);
  if (listeners.size > 0) return;

  const textChannel = queue.textChannel;
  queue.stop();
  await textChannel?.send(notice('⏹ Music stopped since everyone left the channel.', 'info'));
}
