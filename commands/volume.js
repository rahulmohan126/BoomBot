module.exports = {
	main: function(bot, msg) {
        const serverQueue = bot.queue.get(msg.guild.id);
        const args = msg.content.split(' ');
        if (!msg.member.voiceChannel) return bot.sendNotification('You are not in a voice channel!', 'error', msg);
        if (!serverQueue) return bot.sendNotification('There is nothing playing.', 'error', 'msg');
        if (!args[1]) return bot.sendNotification(`The current volume is: **${serverQueue.volume}**`, 'info', msg);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return bot.sendNotification(`I set the volume to: **${args[1]}**`, 'success', msg);
    },
    help: '`volume (1-10)`'
};
