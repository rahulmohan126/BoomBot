module.exports = {
	main: function(bot, msg) {
        const serverQueue = bot.queue.get(msg.guild.id);
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return bot.sendNotification('⏸ Music paused!', 'success', msg);
		}
		else if (serverQueue && !serverQueue.playing) return bot.sendNotification('⏸ Music already paused!', 'success', msg);
		else return bot.sendNotification('There is nothing playing.', 'error', msg);
	 },
	help: '`pause`'
};
