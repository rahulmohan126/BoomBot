module.exports = {
	main: function (bot, guild, msg) {
		var arg = Number(msg.content.split(' ')[0]);

		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else if (arg == '') {
			console.log('xxx');
			bot.sendNotification(`The current volume is: **${guild.queue.volume}**`, 'info', msg);
		}
		else if (!arg) { // Number parse fail
			bot.sendNotification('That is not a valid number for volume.', 'error', msg);
		}
		else {
			// Setting the volume floor to 0 will allow users to server mute the bot.
			const VOLUME_FLOOR = 1;
			const VOLUME_CEILING = 10;

			arg = arg <= VOLUME_FLOOR ? VOLUME_FLOOR : arg;
			arg = arg >= VOLUME_CEILING ? VOLUME_CEILING : arg;

			guild.queue.volume = arg;
			guild.queue.connection.dispatcher.setVolumeLogarithmic(arg / 5);
			bot.sendNotification(`I set the volume to: **${arg}**`, 'success', msg);
		}
	},
	help: 'See/Set the volume for the server. Warning: Music will distort above 10.',
	usage: 'volume (new volume)'
};
