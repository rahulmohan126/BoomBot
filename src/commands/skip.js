module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is nothing playing that I could skip for you.', 'error', msg);
		}
		else {
			guild.queue.connection.dispatcher.end();

			bot.sendNotification('▶︎▶︎ Music skipped!', 'success', msg);
		}
	},
	help: 'Skips the current song to the next one in the queue.',
	usage: 'skip',
	module: 'music'
};
