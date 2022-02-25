module.exports = {
	main: function (bot, guild, msg) {
		// Error will not be triggered if the bot is in delayedEnd as determined
		// by if there is a break time or not
		if (!guild.queue.inUse && !guild.queue.breakTime) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else if (msg.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', msg);
		}
		else {
			guild.queue.end();

			bot.sendNotification('⏹ Music stopped!', 'success', msg);
		}
	},
	help: 'Stop the current song and clears song queue',
	usage: 'stop',
	module: 'music',
	keywords: 'disconnect'
};
