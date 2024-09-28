module.exports = {
	main: function (bot, guild, msg) {

		const arg = msg.content.split(' ')[0].trim();

		if (arg == '') {
			if (guild.dj == '') {
				return bot.sendNotification('There is no current DJ role.', 'info', msg);
			}
			
			bot.sendNotification(`The current DJ is: ${msg.guild.roles.cache.get(guild.dj)}`, 'info', msg);
		}
		else if (guild.checkPerms(msg.author.id) == 2) {
			return bot.sendNotification('Only the guild owner or DJ can assign a DJ.', 'error', msg);
		}

		guild.dj = arg.substring(3, arg.length - 1);
		guild.save();
		bot.sendNotification(`The ${msg.guild.roles.cache.get(guild.dj)} is in the house!`, 'success', msg);
	},
	help: 'Assigns a DJ role, DJs and guild owners are the only ones that can change server settings.',
	usage: 'dj (new DJ role name)',
	module: 'moderation & management'
};
