module.exports = {
	main: function(bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return bot.sendNotification('▶ Resumed the music for you!', 'success', msg);
		}
		else if (serverQueue && serverQueue.playing) {
			return bot.sendNotification('Music is already playing', 'success', 'msg');
		}
		return bot.sendNotification('There is nothing playing.', 'error', msg);
	 },
	help: '`resume`'
};
