module.exports = {
	main: function(bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);
		if (!serverQueue) return bot.sendNotification('There is nothing playing.', 'error', msg);
		let complete = bot.timeToString(Date.now() - serverQueue.songs[0].start) + '/' + bot.timeToString(serverQueue.songs[0].duration);
		return bot.sendNotification(`🎶 Now playing: **${serverQueue.songs[0].title}**\nDuration: \`${complete}\``, 'info', msg);
	},
	help: '`np`',
};
