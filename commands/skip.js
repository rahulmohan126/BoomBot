module.exports = {
	main: function(bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!msg.member.voiceChannel) {
			bot.sendNotification('You are not in a voice channel!', 'error', msg);
		}
		else if (!serverQueue) {
			bot.sendNotification('There is nothing playing that I could skip for you.', 'error', msg);
		}
		else {
			serverQueue.connection.dispatcher.end();
			bot.sendNotification('▶︎▶︎ Music skipped!', 'success', msg);
		}
	},
	help: 'Skips the current song to the next one in the queue.',
	usage: 'skip'
};
