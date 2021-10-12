module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else if (guild.queue.playing) {
			guild.queue.playing = false;
			guild.queue.player.pause();
			bot.sendNotification('⏸ Music paused!', 'success', msg);
		}
		else {
			bot.sendNotification('⏸ Music already paused!', 'success', msg);
		}
	},
	help: 'Pause the current song.',
	usage: 'pause',
	module: 'music'
};
