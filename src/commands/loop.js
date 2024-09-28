module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else if (msg.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', msg);
		}
		else {
			guild.queue.looping = !guild.queue.looping;
			bot.sendNotification(`⟲ Music ${guild.queue.looping ? '' : 'de'}looped!`, 'success', msg);
		}
	},
	help: 'Endlessly replay a song. Can be disabled by using "loop" again or ending music.',
	usage: 'loop',
	module: 'music'
};
