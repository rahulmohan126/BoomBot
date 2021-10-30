module.exports = {
	main: function (bot, guild, msg) {

		const arg = msg.content.split(' ')[0].trim();

		if (arg === '') {
			bot.sendNotification(`The current prefix is: ${guild.prefix}`, 'info', msg);
		}
		else if (guild.checkPerms(msg.author.id) < 2) {
			guild.prefix = arg;
			guild.save();

			bot.sendNotification(`The new prefix is "${guild.prefix}".`, 'success', msg);
		}
		else {
			bot.sendNotification('Only the guild owner can change the prefix.', 'error', msg);
		}
	},
	help: 'See/set the prefix for the server.',
	usage: 'prefix (new prefix)',
	module: 'moderation & management'
};
