module.exports = {
    main: async function(bot, msg, youtube) {

		// Check permissions and args
        const args = msg.content.split(' ');
        const searchString = args.slice(1).join(' ');
        const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send('Voice channel required in order to start playing music');
        const permissions = voiceChannel.permissionsFor(msg.client.user);
		if ((!bot.db[msg.guild.id].channels.voice.includes(msg.member.voiceChannel.id)) && (bot.db[msg.guild.id].channels.voice.length > 0)) {
			return bot.sendNotification('That voice channel is not permitted', 'error', msg);
		}
		if (!permissions.has('CONNECT')) {
            return bot.sendNotification('I cannot connect to your voice channel, make sure I have the proper permissions!', 'error', msg);
        }
        if (!permissions.has('SPEAK')) {
            return bot.sendNotification('I cannot speak in this voice channel, make sure I have the proper permissions!', 'error', msg);
        }
		// Playlist input
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id);
                await bot.handleVideo(video, msg, voiceChannel, true);
            }
            return bot.sendNotification(`✅ Playlist: **${playlist.title}** has been added to the bot.queue!`, 'success', msg);
        }
		else {
			// Url input
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
				// Keyword search
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send(`
__**Song selection:**__

${videos.map(video2 => `**${++index} -** ${video2.title.replace('&#39;', '\'').replace('&amp;', '&')}`).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
                    `).then(async (optionsMsg) => {
					try {
						// Awaiting selection
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });
                    } catch (err) {
						// No valid selection given
                        return bot.sendNotification('No or invalid value entered, cancelling video selection.', 'error', msg);
                    }
					const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                    optionsMsg.delete();
					})
					.catch(err => {
                        console.log(err);
                    });
                } catch (err) {
					// No search results
                    console.error(err);
                    return bot.sendNotification('🆘 I could not obtain any search results.', 'error', msg);
                }
            }
            return bot.handleVideo(video, msg, voiceChannel)
            .catch(err => thing = err);
        }
        },
        help: '`play [playlist | link | search term]`'
};
