module.exports = {
	main: function(bot, msg) {
		var args = msg.content.split(' ');
		var config = bot.getGuild(msg.guild.id);
		
		try {
			if ((args[0] === 'add' && args[0] === 'remove') && msg.author.id === msg.guild.ownerID) {
				let channel = msg.guild.channels.find(channel => channel.name === args[2]);
				if (args[0] === 'add') {
					config[args[1]].push(channel.id)
					bot.sendNotification('Channel whitelisted.', 'success', msg);
				}
				else {
					config[args[1]] = config[args[1]].filter(x => x != channel);
					bot.sendNotification('Channel blacklisted.', 'success', msg);
				}
			}
			else if (args[0] === 'list') {
				var whiteListed = msg.guild.channels.filter(channel => config[args[1]].includes(channel.id).array());
				let printList = [];
				for (var i = 0; i < whiteListed.length; i++) {
					printList.push(whiteListed[i].name);
				}
				bot.sendNotification('The allowed channels are '+printList.join(', '), 'info', msg);
			}
			else {
				bot.sendNotification('Inadequate permissions to use this command.', 'error', msg);
			}
		}
		catch (err) {
			bot.sendNotification('Args error: Check arguements and try again.', 'error', msg);
		}

		bot.saveConfig();

	},
	help: 'Set bot-allowed text and voice channels',
	usage: 'channel [add | remove | list] [voice | text] [channel name]',
};