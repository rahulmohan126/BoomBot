module.exports = {
	main: function (bot, msg) {
		const guild = bot.getGuild(msg.guild.id);
		const args = msg.content.split(' ');

		try {
			if ((args[0] === 'add' || args[0] === 'remove') && msg.author.id === msg.guild.ownerID) {
				let channel = msg.guild.channels.find(channel => channel.name === args[2]);
				if (args[0] === 'add') {
					guild.channels[args[1]].push(channel.id)
					bot.sendNotification('Channel whitelisted.', 'success', msg);
				}
				else {
					guild.channels[args[1]] = guild.channels[args[1]].filter(x => x != channel.id);
					bot.sendNotification('Channel blacklisted.', 'success', msg);
				}
			}
			else if (args[0] === 'list') {
				var whiteListed = msg.guild.channels.filter(channel => {
					return (guild.channels[args[1]].includes(channel.id));
				});
				let printList = [];
				for (let channel of whiteListed) {
					printList.push(channel[1].name);
				}
				bot.sendNotification(`The allowed channels are ${printList.join(', ')}`, 'info', msg);
			}
			else {
				bot.sendNotification('Inadequate permissions to use this command.', 'error', msg);
			}
		}
		catch (err) {
			console.log(err);
			bot.sendNotification('Args error: Check arguements and try again.', 'error', msg);
		}

		bot.saveConfig();

	},
	help: 'Set bot-allowed text and voice channels',
	usage: 'channel [add | remove | list] [voice | text] [channel name]',
};