module.exports = {
	main: function(bot, msg) {
		var parameters = msg.content.split(' ');
		var usage = bot.db[msg.guild.id].prefix+'channel [add | remove | list] [voice | text] [channel name]`'
		parameters.shift();
		if (msg.author.id === msg.guild.ownerID) {
			if (parameters.length == 3) {
				if (parameters[0] === 'add') {
					let channel = msg.guild.channels.find('name', parameters[2])
					if (!channel) {
						return bot.sendNotification('That channel was not found.', 'error', msg);
					}
					if (parameters[1] === 'text') {
						bot.db[msg.guild.id].channels.text.push(channel.id);
					}
					else if (parameters[1] === 'voice') {
						bot.db[msg.guild.id].channels.voice.push(channel.id);
					}
					else {
						return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
					}
					bot.saveConfig();
					return bot.sendNotification(channel.name+' was added to the whitelisted channels', 'success', msg)
				}
				else if (parameters[0] === 'remove') {
					let channel = msg.guild.channels.find(channel => channel.name === parameters[2])
					if (!channel) {
						return bot.sendNotification('That channel was not found.', 'error', msg);
					}
					if (parameters[1] === 'text') {
						bot.db[msg.guild.id].channels.text = bot.db[msg.guild.id].channels.text.filter(x => x != channel.id);
					}
					else if (parameters[1] === 'voice') {
						bot.db[msg.guild.id].channels.voice = bot.db[msg.guild.id].channels.voice.filter(x => x != channel.id);
					}
					else {
						return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
					}
					bot.saveConfig();
					return bot.sendNotification(channel.name+' was removed from the whitelisted channels', 'success', msg)
				}
				else if (parameters[0] === 'list') {
					if (parameters[1] === 'text') {
						var whiteListed = msg.guild.channels.filter(channel => bot.db[msg.guild.id].channels.text.includes(channel.id));
						printList = []
						for (var i = 0; i < whiteListed.length; i++) {
							printList.push(whiteListed[i].name);
						}
						return bot.sendNotification('The allowed channels are '+printList.join(', '), 'info', msg);
					}
					else if (parameters[1] === 'voice') {
						var whiteListed = msg.guild.channels.filter(channel => bot.db[msg.guild.id].channels.voice.includes(channel.id)).array();
						printList = []
						for (var i = 0; i < whiteListed.length; i++) {
							printList.push(whiteListed[i].name);
						}
						return bot.sendNotification('The allowed channels are '+printList.join(', '), 'info', msg);
					}
					else {
						return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
					}
				}
				else {
					return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
				}
			}
			else if (parameters.length == 2) {
				if (parameters[0] === 'list') {
					if (parameters[1] === 'text') {
						var whiteListed = msg.guild.channels.filter(channel => bot.db[msg.guild.id].channels.text.includes(channel.id));
						printList = []
						for (var i = 0; i < whiteListed.length; i++) {
							printList.push(whiteListed[i].name);
						}
						return bot.sendNotification('The allowed channels are '+printList.join(', '), 'info', msg);
					}
					else if (parameters[1] === 'voice') {
						var whiteListed = msg.guild.channels.filter(channel => bot.db[msg.guild.id].channels.voice.includes(channel.id)).array();
						printList = []
						for (var i = 0; i < whiteListed.length; i++) {
							printList.push(whiteListed[i].name);
						}
						return bot.sendNotification('The allowed channels are '+printList.join(', '), 'info', msg);

					}
					else {
						return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
					}
				}
				else {
					return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
				}
			}
			else {
				return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
			}
		}
		else {
			if (parameters.length == 2) {
				if (parameters[1] == 'add' || parameters == 'remove') {
					return bot.sendNotification('Only the guild owner can edit allowed channels.', 'error', msg);
				}
				else if (parameters[1] == 'list') {
					if (parameters[1] === 'text') {
						var whiteListed = msg.guild.channels.filter(channel => bot.db[msg.guild.id].channels.text.includes(channel.id)).array();
						for (var i = 0; i < whiteListed.length; i++) {
							whiteListed[i] = whiteListed[i].name;
						}
						return bot.sendNotification('The allowed channels are '+whiteListed.join(', '), 'info', msg);
					}
					else if (parameters[1] === 'voice') {
						var whiteListed = msg.guild.channels.filter(channel => bot.db[msg.guild.id].channels.voice.includes(channel.id)).array();
						for (var i = 0; i < whiteListed.length; i++) {
							whiteListed[i] = whiteListed[i].name;
						}
						return bot.sendNotification('The allowed channels are '+whiteListed.join(', '), 'info', msg);

					}
					else {
						return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
					}
				}
				else {
					return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
				}
			}
			else {
				return bot.sendNotification('Invalid usage `'+usage+'`', 'error', msg);
			}
		}
	},
	help: 'channel [add | remove | list] [voice | text] [channel name]`, add and remove for server owner only'
};
