module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
			guild.queue.loop = !guild.queue.loop;
			bot.sendNotification(`⟲ Music ${guild.queue.loop ? '' : 'de'}looped!`, 'success', msg);
		}
	},
	help: `Keep replaying a song... forever. Can be disabled by using loop again or ending music.`,
	usage: 'loop'
};
