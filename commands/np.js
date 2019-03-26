module.exports = {
    main: function(bot, msg) {
        const serverQueue = bot.queue.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.');
		return msg.channel.send(`🎶 Now playing: **${serverQueue.songs[0].title}**`);
	},
    help: '`np`',   
};
