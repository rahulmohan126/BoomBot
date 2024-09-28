module.exports = {
	main: function (bot, guild, msg) {
		if (guild.checkPerms(msg.member) === 2) {
			return bot.sendNotification('Only the guild owner can toggle settings.', 'error', msg);
		}

		guild.instant = !guild.instant;
		guild.save();
		bot.sendNotification(`Song search ${guild.instant ? 'disabled!' : 'enabled!'}`, 'success', msg);
	},
	help: 'Toggles play with search. While off, music will be played immediately upon request, insteading of giving search results.',
	usage: 'search',
	module: 'moderation & management'
};
