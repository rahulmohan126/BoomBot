import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { isVoiceChannelAllowed } from '../guilds/GuildStore.js';
import { createTrack } from '../music/Track.js';
import { card } from '../ui/embeds.js';
import { formatDuration } from '../ui/format.js';
import { VideoUnavailableError, type ResolveResult } from '../youtube/YouTubeService.js';
import type { Command, CommandContext } from './types.js';

/**
 * Checks the member's and bot's voice state; returns an error message if music can't be played
 */
function checkVoiceChannel({
  member,
  queue,
  settings,
  interaction,
}: CommandContext): string | null {
  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    return 'Voice channel required in order to start playing music';
  }
  if (queue.voiceChannelId && queue.voiceChannelId !== voiceChannel.id) {
    return 'You must be in the same voice channel as the bot to play music';
  }
  if (!isVoiceChannelAllowed(settings, voiceChannel.id)) {
    return 'That voice channel is not permitted';
  }

  const permissions = voiceChannel.permissionsFor(interaction.guild.members.me!);
  if (!permissions.has(PermissionFlagsBits.Connect)) {
    return 'I cannot connect to your voice channel, make sure I have the proper permissions!';
  }
  if (!permissions.has(PermissionFlagsBits.Speak)) {
    return 'I cannot speak in this voice channel, make sure I have the proper permissions!';
  }
  return null;
}

export const play: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a video or playlist from YouTube')
    .addStringOption((option) =>
      option.setName('query').setDescription('A link, playlist, or search term').setRequired(true),
    ),
  async execute(ctx) {
    const { interaction, member, queue, bot, notify, reply } = ctx;
    const query = interaction.options.getString('query', true).trim();

    if (query === '') {
      return notify('Please enter a search query or link to play a song', 'error');
    }
    const voiceError = checkVoiceChannel(ctx);
    if (voiceError) {
      return notify(voiceError, 'error');
    }

    // Looking up playlists can take longer than the 3s Discord allows for a reply
    await interaction.deferReply();

    let result: ResolveResult;
    try {
      result = await bot.youtube.resolve(query);
    } catch (err) {
      if (err instanceof VideoUnavailableError) {
        return notify(
          err.reason === 'live' ? 'Cannot play livestreams' : 'Video is private or unavailable',
          'error',
        );
      }
      console.error('Failed to resolve query:', err);
      return notify('🆘 I could not obtain any search results.', 'error');
    }

    if (result.kind === 'none' || (result.kind === 'playlist' && result.videos.length === 0)) {
      return notify('🆘 I could not obtain any search results.', 'error');
    }

    try {
      const textChannel = interaction.channel?.isSendable() ? interaction.channel : null;
      await queue.connect(member.voice.channel!, textChannel);
    } catch (err) {
      console.error('Failed to join voice channel:', err);
      return notify('Could not join voice channel', 'error');
    }

    if (result.kind === 'playlist') {
      queue.enqueue(...result.videos.map((video) => createTrack(video, member)));
      return notify(`✅ Playlist: **${result.title}** has been added to the queue!`, 'success');
    }

    const track = createTrack(result.video, member);
    const timeUntilPlayed = queue.isActive ? queue.remainingMs : 0;
    queue.enqueue(track);

    await reply(
      card({
        header: 'Added to queue',
        body: [
          { name: 'Duration', value: `\`${formatDuration(track.durationMs)}\``, inline: true },
          {
            name: 'Time Until Played',
            value: `\`${formatDuration(timeUntilPlayed)}\``,
            inline: true,
          },
          { name: 'Requested By', value: `\`${member.displayName}\``, inline: true },
        ],
        tone: 'success',
        member,
        title: track.title,
        url: track.url,
        thumbnail: track.thumbnail,
      }),
    );
  },
};
