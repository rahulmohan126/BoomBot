module.exports = {
	main: function (bot, guild, msg) {
		const arg = msg.content.split(' ')[0].trim();

		// Returns the current prefix, no change
		if (arg === '') {
			return bot.sendNotification(`The current prefix is: ${guild.prefix}`, 'info', msg);
		}
		// Checks permissions if user wants to change the prefix
		else if (guild.checkPerms(msg.author.id) === 2) {
			bot.sendNotification('Only the guild owner or DJ can change the prefix.', 'error', msg);
		}
		
		guild.prefix = arg;
		guild.save();
		bot.sendNotification(`The new prefix is "${guild.prefix}".`, 'success', msg);
	},
	help: 'See/set the prefix for the server.',
	usage: 'prefix (new prefix)',
	module: 'moderation & management'
};
