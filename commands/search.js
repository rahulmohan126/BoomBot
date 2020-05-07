module.exports = {
	main: function (bot, msg) {
		if (msg.author.id === msg.guild.ownerID || msg.roles.cache.has(guild.dj)) {
			serverQueue.instant = !serverQueue.instant;
			bot.sendNotification(`Instant play ${serverQueue.instant ? 'enabled!' : 'disabled!'}`, 'success', msg);
			bot.saveConfig();
		}
		else {
			bot.sendNotification('Only the guild owner can toggle settings.', 'error', msg);
		}
	},
	help: `Toggles play with search. While off, music will be played immediately upon request, insteading of giving search results.`,
	usage: 'volume (new volume)'
};
