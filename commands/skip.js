module.exports = {
	main: function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!msg.member.voice.channel) {
			bot.sendNotification('You are not in a voice channel!', 'error', msg);
		}
		else if (!serverQueue) {
			bot.sendNotification('There is nothing playing that I could skip for you.', 'error', msg);
		}
		else {
			bot.sendNotification('▶︎▶︎ Music skipped!', 'success', msg);
			serverQueue.connection.dispatcher.end();
		}
	},
	help: 'Skips the current song to the next one in the queue.',
	usage: 'skip'
};
