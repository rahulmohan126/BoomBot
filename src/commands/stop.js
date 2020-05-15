module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
			guild.queue.connection.dispatcher.end();
			guild.queue.connection.disconnect();

			bot.sendNotification('⏹ Music stopped!', 'success', msg);
		}
	},
	help: 'Stop the current song and clears song queue',
	usage: 'stop',
	module: 'music'
};
