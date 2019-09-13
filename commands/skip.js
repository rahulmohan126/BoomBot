module.exports = {
	 main: function(bot, msg) {
			const serverQueue = bot.queue.get(msg.guild.id);
			if (!msg.member.voiceChannel) return bot.sendNotification('You are not in a voice channel!', 'error', msg);
			if (!serverQueue) return bot.sendNotification('There is nothing playing that I could skip for you.', 'error', msg);
			serverQueue.connection.dispatcher.end('Skip command has been used!');
			return undefined;
		 },
		help: '`skip`'
};
