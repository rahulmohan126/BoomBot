module.exports = {
	main: async function (bot, msg) {
		const args = msg.content.split(' ');
		const searchString = msg.content;
		const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
		const voiceChannel = msg.member.voice.channel;
		const guildVoiceChannel = bot.getGuild(msg.guild.id).voiceChannel;

		// Checks if voice channel is valid (if any)
		if (!voiceChannel) {
			bot.sendNotification('Voice channel required in order to start playing music', 'error', msg);
			return;
		}
		else if (guildVoiceChannel !== '' && guildVoiceChannel === voiceChannel.id) {
			bot.sendNotification('That voice channel is not permitted', 'error', msg);
			return;
		}

		// Checks channel permissions
		const permissions = voiceChannel.permissionsFor(msg.client.user);

		if (!permissions.has('CONNECT')) {
			return bot.sendNotification('I cannot connect to your voice channel, make sure I have the proper permissions!', 'error', msg)
		}
		else if (!permissions.has('SPEAK')) {
			return bot.sendNotification('I cannot speak in this voice channel, make sure I have the proper permissions!', 'error', msg);
		}

		// Checks if url is a playlist. If so, handles the video.
		if (url.match(/^.*(youtu.be\/|list=)([^#\&\?]*).*/)) {
			const playlist = await bot.youtube.getPlaylist(url);
			const videos = await playlist.getVideos();

			for (const video of Object.values(videos)) {
				await bot.handleVideo(video, msg, voiceChannel, true);
			}

			// Sends custom completion message after the entire playlist is loaded.
			bot.sendNotification(`✅ Playlist: **${playlist.title}** has been added to the queue!`, 'success', msg);
		}
		else {
			// Tries to see if url is a direct video link. If so, handles the video
			try {
				var video = await bot.youtube.getVideo(url);
				await bot.handleVideo(video, msg, voiceChannel).catch(err => console.error(err));
			}
			// If not, treats the argument as a search query
			catch (error) {
				try {
					var videos = await bot.youtube.searchVideos(searchString, 10);

					// No results for the given search query will throw an error,
					// it will automatically be caught by the SOS error message.
					if (videos.length === 0) throw new Error();

					// Sends user the options.
					let index = 0;

					// TODO Change this into an embed
					msg.channel.send(`
__**Song selection:**__

${videos.map(video => `**${++index} -** ${bot.escapeMarkdown(video.title)}`).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
					`).then(async function (selectionMsg) {
						// Awaits for user response
						try {
							var response = await msg.channel.awaitMessages(indexMsg =>
								indexMsg.content > 0 && indexMsg.content < videos.length + 1, {
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
						var index = response.first().content;
						await bot.handleVideo(videos[index - 1], msg, voiceChannel).catch(err => console.error(err));
					});
				}
				catch (err) {
					console.error(err);
					return bot.sendNotification('🆘 I could not obtain any search results.', 'error', msg);
				}
			}
		}
	},
	help: 'Play any bot.youtube video, use keywords, direct links, or playlists.',
	usage: 'play [keyword | video link | playlist link]',
};
