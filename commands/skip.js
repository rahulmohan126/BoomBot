module.exports = {
     main: function(bot, msg) {
			const serverQueue = bot.queue.get(msg.guild.id);
			if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
			if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.');
			serverQueue.connection.dispatcher.end('Skip command has been used!');
			return undefined;
		 },
		help: '`skip`'
};
