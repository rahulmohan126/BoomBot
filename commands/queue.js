module.exports = {
	main: function(bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);
		if (!serverQueue) return bot.sendNotification('There is nothing playing.', 'error', msg);
		return msg.channel.send(`
__**Song bot.queue:**__

${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Now playing:** ${serverQueue.songs[0].title}
		`);
	 },
	help: '`queue`'
};
