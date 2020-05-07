module.exports = {
	main: function (bot, msg) {

		const arg = msg.content.split(' ')[0].trim();
		
		if (arg === '') {
			bot.sendNotification(`The current prefix is: ${msg.guild.member((bot.getGuild(msg.guild.id).dj))}`, 'info', msg);
		}
		else if (msg.author.id === msg.guild.ownerID) {
			bot.getGuild(msg.guild.id).dj = arg;
			bot.saveConfig();
			bot.sendNotification(`The DJ is in the house!`, 'success', msg);
		}
		else {
			bot.sendNotification('Only the guild owner can assign a DJ.', 'error', msg);
		}
	},
	help: `Assigns a DJ role, DJs and guild owners are the only ones that can change server settings.`,
	usage: 'dj (new dj)'
};
