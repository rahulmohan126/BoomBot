module.exports = {
	main: function(bot, msg) {
		if (msg.content.split(' ').length == 1) {
			var prefix = bot.db[msg.guild.id].prefix;
			return bot.sendNotification('The current prefix is: '+prefix, 'info', msg);
		}
		else {
			if (msg.author.id === msg.guild.ownerID) {
				var newPrefix = msg.content.split(' ')[1];
				if (newPrefix.includes(' ')) {
					return bot.sendNotification('Prefixes cannot contain whitepace.', 'error', msg);
				}
				else {
					bot.db[msg.guild.id].prefix = newPrefix;
					bot.saveConfig();
					return bot.sendNotification('The new prefix is '+newPrefix+'.', 'success', msg);
				}
			}
			else {
				return bot.sendNotification('Only the guild owner can change the prefix.', 'error', msg);
			}
		}
	},
	help: 'prefix (new prefix)'
};
