module.exports = {
	main: function(bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);
		if (!msg.member.voiceChannel) return bot.sendNotification('You are not in a voice channel!', 'error', msg);
		if (!serverQueue) return bot.sendNotification('There is nothing playing that I could stop for you.', 'error', msg);
		serverQueue.connection.dispatcher.end('Stop command has been used!');
		bot.queue.delete(msg.guild.id);
		return undefined;
	},
	help: '`stop`'
};
