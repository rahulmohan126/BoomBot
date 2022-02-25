module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is nothing playing that I could skip for you.', 'error', msg);
		}
		else if (msg.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', msg);
		}
		else {
			guild.queue.player.stop();
			bot.sendNotification('▶︎▶︎ Music skipped!', 'success', msg);
		}
	},
	help: 'Skips the current song to the next one in the queue.',
	usage: 'skip',
	module: 'music'
};
