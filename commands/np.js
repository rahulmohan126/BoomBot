module.exports = {
	main: function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!serverQueue) {
			bot.sendNotification('There is nothing playing.', 'error', msg);
		}
		else {
			const timeLeftInSong = bot.timeToString(Date.now() - serverQueue.songs[0].startTime);
			const songDuration = bot.timeToString(serverQueue.songs[0].duration);

			bot.sendNotification(`
🎶 Now playing: **${serverQueue.songs[0].title}**

**Looped:** ${serverQueue.loop ? 'Looped' : 'Not looped'}
Duration: \`${timeLeftInSong} / ${songDuration}\``, 'info', msg);
		}
	},
	help: 'See what song is playing and how much time is left.',
	usage: 'np'
};
