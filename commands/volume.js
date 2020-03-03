module.exports = {
	main: function (bot, msg) {

		const serverQueue = bot.queue.get(msg.guild.id);
		var arg = msg.content.split(' ')[0];

		if (!msg.member.voiceChannel) {
			bot.sendNotification('You are not in a voice channel!', 'error', msg);
		}
		else if (!serverQueue) {
			bot.sendNotification('There is nothing playing.', 'error', 'msg');
		}
		else if (arg === '') {
			bot.sendNotification(`The current volume is: **${serverQueue.volume}**`, 'info', msg);
		}
		else {
			arg = arg < 0 ? 0 : arg; // Sets volume floor to 0
			serverQueue.volume = arg;
			serverQueue.connection.dispatcher.setVolumeLogarithmic(arg / 5);
			bot.sendNotification(`I set the volume to: **${arg}**`, 'success', msg);
		}
	},
	help: 'See/Set the volume for the server. Warning: Music will distort above 10.',
	usage: 'volume (new volume)'
};
