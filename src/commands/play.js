const Bot = require('../models/bot');
const Guild = require('../models/guild');
const { ChatInputCommandInteraction } = require('discord.js');

module.exports = {
	/**
	 * @param {Bot} bot 
	 * @param {Guild} guild 
	 * @param {ChatInputCommandInteraction} int 
	 */
	main: async function (bot, guild, int) {
		const query = int.options.getString('query');
		const voiceChannel = int.member.voice.channel;

		// Checks if a search string exists.
		if (query === '') {
			bot.sendNotification('Please enter a search query or link to play a song', 'error', int);
			return;
		}

		// Checks if user is in a voice channel
		if (!voiceChannel) {
			return bot.sendNotification('Voice channel required in order to start playing music', 'error', int);
		}
		// Check if user is in the same voice channel as the bot (if any)
		else if (guild.queue.voice && guild.queue.voice !== voiceChannel) {
			return bot.sendNotification('You must be in the same voice channel as the bot to play music', 'error', int);
		}
		else if (!guild.checkVoiceChannelByID(voiceChannel.id)) {
			return bot.sendNotification('That voice channel is not permitted', 'error', int);
		}

		
		// Checks channel permissions
		const permissions = voiceChannel.permissionsFor(bot.user);
				
		if (!permissions.has('Connect')) {
			return bot.sendNotification('I cannot connect to your voice channel, make sure I have the proper permissions!', 'error', int);
		}
		else if (!permissions.has('Speak')) {
			return bot.sendNotification('I cannot speak in this voice channel, make sure I have the proper permissions!', 'error', int);
		}

		
		// Checks if url is a playlist. If so, handles the video.
		if (query.match(/^.*(youtu.be\/|list=)([^#\&\?]*).*/)) {
			const playlist = await bot.youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			
			for (const video of Object.values(videos)) {
				await guild.queue.handleVideo(video, int, voiceChannel, true);
			}
			
			// Sends custom completion message after the entire playlist is loaded.
			return bot.sendNotification(`✅ Playlist: **${playlist.title}** has been added to the queue!`, 'success', int);
		}
		
		// Tries to see if url is a direct video link. If so, handles the video
		try {
			var video = await bot.youtube.getVideo(query);
			await guild.queue.handleVideo(video, int, voiceChannel).catch(err => console.error(err));
			return;
		}
		catch (err) {
		}
		
		// Try the argument as a search query
		var videos;
		try {
			videos = await bot.youtube.searchVideos(query, 10);

			// No results for the given search query will throw an error,
			// it will automatically be caught by the SOS error message.
			if (videos.length === 0) throw new Error();
		}
		catch (err) {
			return bot.sendNotification('🆘 I could not obtain any search results.', 'error', int);
		}

		return guild.queue.handleVideo(videos[0], int, voiceChannel).catch(err => console.error(err));
	},
	help: 'Play any Youtube video, use keywords, direct links, or playlists.',
	usage: 'play [keyword | video link | playlist link]',
	module: 'music'
};
