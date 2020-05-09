module.exports = {
	main: function (bot, guild, msg) {
		if (guild.checkPerms(msg.member) < 2) {
			guild.instant = !guild.instant.instant;
			guild.save();
			bot.sendNotification(`Instant play ${guild.instant ? 'enabled!' : 'disabled!'}`, 'success', msg);
		}
		else {
			bot.sendNotification('Only the guild owner can toggle settings.', 'error', msg);
		}
	},
	help: `Toggles play with search. While off, music will be played immediately upon request, insteading of giving search results.`,
	usage: 'volume (new volume)'
};
