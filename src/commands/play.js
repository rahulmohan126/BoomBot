const { escapeMarkdown } = require('discord.js');

const valFilter = msg => (0 < msg.content && msg.content <= videos.length);

module.exports = {
	main: async function (bot, guild, msg) {
		const args = msg.content.split(' ');
		const searchString = msg.content;
		const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
		const voiceChannel = msg.member.voice.channel;

		// Checks if a search string exists.
		if (searchString === '') {
			bot.sendNotification('Please enter a search query or link to play a song', 'error', msg);
			return;
		}

		// Checks if user is in a voice channel
		if (!voiceChannel) {
			return bot.sendNotification('Voice channel required in order to start playing music', 'error', msg);
		}
		// Check if user is in the same voice channel as the bot (if any)
		else if (guild.queue.voice && guild.queue.voice !== voiceChannel) {
			return bot.sendNotification('You must be in the same voice channel as the bot to play music', 'error', msg);
		}
		else if (!guild.checkVoiceChannelByID(voiceChannel.id)) {
			return bot.sendNotification('That voice channel is not permitted', 'error', msg);
		}

		
		// Checks channel permissions
		const permissions = voiceChannel.permissionsFor(msg.client.user);
				
		if (!permissions.has('Connect')) {
			return bot.sendNotification('I cannot connect to your voice channel, make sure I have the proper permissions!', 'error', msg);
		}
		else if (!permissions.has('Speak')) {
			return bot.sendNotification('I cannot speak in this voice channel, make sure I have the proper permissions!', 'error', msg);
		}

		
		// Checks if url is a playlist. If so, handles the video.
		if (url.match(/^.*(youtu.be\/|list=)([^#\&\?]*).*/)) {
			const playlist = await bot.youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			
			for (const video of Object.values(videos)) {
				await guild.queue.handleVideo(video, msg, voiceChannel, true);
			}
			
			// Sends custom completion message after the entire playlist is loaded.
			return bot.sendNotification(`✅ Playlist: **${playlist.title}** has been added to the queue!`, 'success', msg);
		}
		
		// Tries to see if url is a direct video link. If so, handles the video
		try {
			var video = await bot.youtube.getVideo(url);
			await guild.queue.handleVideo(video, msg, voiceChannel).catch(err => console.error(err));
			return;
		}
		catch (err) {
		}
		
		// Try the argument as a search query
		var videos;
		try {
			videos = await bot.youtube.searchVideos(searchString, 10);

			// No results for the given search query will throw an error,
			// it will automatically be caught by the SOS error message.
			if (videos.length === 0) throw new Error();
		}
		catch (err) {
			return bot.sendNotification('🆘 I could not obtain any search results.', 'error', msg);
		}

		// If search is disabled, play the first video
		if (guild.instant) {
			await guild.queue.handleVideo(videos[0], msg, voiceChannel).catch(err => console.error(err));
			return;
		}

		let index = 0;
		const selectionContent = `
${videos.map(video => `**${++index}. ** [${escapeMarkdown(video.title)}](${video.url})`).join('\n')}
		
Please provide a value to select one of the search results ranging from 1-10.`;
		let selectionMsg = await bot.sendNotification(selectionContent, 'info', msg, [], 'Song Selection');

		try {
			var response = await msg.channel.awaitMessages({
				filter: valFilter,
				max: 1,
				time: 5000, // 5000 ms
				errors: ['time']
			});
		}
		catch (err) {
			return bot.sendNotification('No valid value entered, cancelling video selection.', 'error', msg);
		}

		// Deletes the selection message and handles the video
		selectionMsg.delete();
		let selection = parseInt(response.first().content) - 1;
		await guild.queue.handleVideo(videos[selection], msg, voiceChannel).catch(err => console.error(err));
	},
	help: 'Play any Youtube video, use keywords, direct links, or playlists.',
	usage: 'play [keyword | video link | playlist link]',
	module: 'music'
};
