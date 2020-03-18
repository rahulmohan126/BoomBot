module.exports = {
	main: function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!serverQueue) {
			bot.sendNotification('There is nothing playing.', 'error', msg);
		}
		else {
			let complete = `${bot.timeToString(Math.floor((Date.now() - serverQueue.songs[0].start) / 1000))} / ${bot.timeToString(serverQueue.songs[0].duration)}`;
			bot.sendNotification(`🎶 Now playing: **${serverQueue.songs[0].title}**\nDuration: \`${complete}\``, 'info', msg);
		}
	},
	help: 'See what song is playing and how much time is left.',
	usage: 'np'
};
