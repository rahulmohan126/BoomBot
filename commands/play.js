module.exports = {
	main: async function (bot, msg, youtube) {

		const Entities = require('html-entities').AllHtmlEntities;
		const entities = new Entities();

		const args = msg.content.split(' ');
		const searchString = msg.content;
		const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
		const voiceChannel = msg.member.voiceChannel;
		const guildVoiceChannels = bot.getGuild(msg.guild.id).channels.voice;

		if (!voiceChannel) {
			bot.sendNotification('Voice channel required in order to start playing music', 'error', msg);
			return;
		}
		else if (guildVoiceChannels.length > 0 ? !guildVoiceChannels.includes(msg.member.voiceChannel.id) : false) {
			bot.sendNotification('That voice channel is not permitted', 'error', msg);
			return;
		}


		const permissions = voiceChannel.permissionsFor(msg.client.user);

		if (!permissions.has('CONNECT')) {
			bot.sendNotification('I cannot connect to your voice channel, make sure I have the proper permissions!', 'error', msg)
			return;
		}
		else if (!permissions.has('SPEAK')) {
			bot.sendNotification('I cannot speak in this voice channel, make sure I have the proper permissions!', 'error', msg);
			return;
		}

		if (url.match(/^.*(youtu.be\/|list=)([^#\&\?]*).*/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				await bot.handleVideo(video, msg, voiceChannel, true);
			}
			bot.sendNotification('✅ Playlist: **${playlist.title}** has been added to the bot.queue!', 'success', msg);
			return;
		}
		else {
			try {
				var video = await youtube.getVideo(url);
			}
			catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					let index = 0;
					msg.channel.send(`
__**Song selection:**__

${videos.map(video => `**${++index} -** ${entities.decode(video.title)}`).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
					`).then(async function (optionsMsg) {
						try {
							var response = await msg.channel.awaitMessages(indexMsg => indexMsg.content > 0 && indexMsg.content < 11, {
								maxMatches: 1,
								time: 10000,
								errors: ['time']
							});
						}
						catch (err) {
							return (bot.sendNotification('No or invalid value entered, cancelling video selection.', 'error', msg));
						}

						optionsMsg.delete();
						const video = videos[parseInt(response.first().content) - 1];
						bot.handleVideo(video, msg, voiceChannel).catch(err => console.error(err));
					}).catch(err => console.error(err));
				}
				catch (err) {
					console.error(err);
					return (bot.sendNotification('🆘 I could not obtain any search results.', 'error', msg));
				}
			}
			if (video === undefined) return;
			bot.handleVideo(video, msg, voiceChannel).catch(err => console.error(err));
		}
	},
	help: 'Play any youtube video, use keywords, direct links, or playlists.',
	usage: 'play [keyword | video link | playlist link]',
};
