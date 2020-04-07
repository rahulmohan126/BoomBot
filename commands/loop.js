module.exports = {
	main: function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!msg.member.voice.channel) {
			bot.sendNotification('You must be in a voice channel in order to use the loop command.', 'error', msg);
		}
		else if (!serverQueue) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
			serverQueue.loop = !serverQueue.loop;
			bot.sendNotification(`⟲ Music ${serverQueue.loop ? '' : 'de'}looped!`, 'success', msg);
		}
	},
	help: `Keep replaying a song... forever. Can be disabled by using loop again or using the stop command.`,
	usage: 'loop'
};
