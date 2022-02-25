module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else if (msg.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', msg);
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
