module.exports = {
	main: function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!serverQueue) {
			bot.sendNotification('There is nothing playing.', 'error', msg);
		}
		else if (!serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			bot.sendNotification('▶ Music resumed!', 'success', msg);
		}
		else {
			bot.sendNotification('▶ Music is already playing', 'success', msg);
		}
	},
	help: 'Resumes the current song.',
	usage: 'resume'
};
