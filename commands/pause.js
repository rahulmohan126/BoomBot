module.exports = {
	main: function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!serverQueue) {
			bot.sendNotification('There is nothing playing.', 'error', msg);
		}
		else if (serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			bot.sendNotification('⏸ Music paused!', 'success', msg);
		}
		else {
			bot.sendNotification('⏸ Music already paused!', 'success', msg);
		}
	},
	help: 'Pause the current song.',
	usage: 'pause'
};
