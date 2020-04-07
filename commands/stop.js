module.exports = {
	main: function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!msg.member.voice.channel) {
			bot.sendNotification('You must be in a voice channel in order to use the stop command.', 'error', msg);
		}
		else if (!serverQueue) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
			serverQueue.connection.dispatcher.end();
			serverQueue.connection.disconnect();
			bot.queue.delete(msg.guild.id);

			bot.sendNotification('⏹ Music stopped!', 'success', msg);
		}
	},
	help: 'Stop the current song and clears song queue',
	usage: 'stop'
};
