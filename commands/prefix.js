module.exports = {
	main: function (bot, msg) {

		const arg = msg.content.split(' ')[0].trim();

		if (arg === '') {
			bot.sendNotification(`The current prefix is: ${bot.getGuild(msg.guild.id).prefix}`, 'info', msg);
		}
		else if (msg.author.id === msg.guild.ownerID) {
			bot.getGuild(msg.guild.id).prefix = arg;
			bot.saveConfig();
			bot.sendNotification(`The new prefix is ${arg}.`, 'success', msg);
		}
		else {
			bot.sendNotification('Only the guild owner can change the prefix.', 'error', msg);
		}
	},
	help: 'See/set the prefix for the server.',
	usage: 'prefix (new prefix)'
};
