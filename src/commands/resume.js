module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else if (msg.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', msg);
		}
		else if (!guild.queue.playing) {
			guild.queue.playing = true;
			guild.queue.player.unpause();
			bot.sendNotification('▶ Music resumed!', 'success', msg);
		}
		else {
			bot.sendNotification('▶ Music is already playing', 'success', msg);
		}
	},
	help: 'Resumes the current song.',
	usage: 'resume',
	module: 'music',
	aliases: ['unpause']
};
