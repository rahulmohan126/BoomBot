module.exports = {
	main: function (bot, msg) {
		const guild = bot.getGuild(msg.guild.id);
		const args = msg.content.split(' ');

		try {
			let channelType = args[0];
			let channelName = args[1];

			selectedChannel = guild[channelType + 'Channel'];

			if (selectedChannel === undefined) throw new Error();

			if (channelName !== undefined && msg.author.id === msg.guild.ownerID) {
				if (args[1] === 'all') {
					guild[args[0] + 'Channel'] = ''
				}
				else {
					foundCommand = msg.guild.channels.cache.find(channel => channel.name === args[1]);
					if (foundCommand === undefined) {
						bot.sendNotification(`"${args[1]}" is not a valid channel, please enter a real channel. ` +
							`Warning: If multiple channels have the same name, then the bot will select the first channel it finds.`, 'error', msg);
						return;
					}
					guild[args[0] + 'Channel'] = msg.guild.channels.cache.find(channel => channel.name === args[1]).id;
				}

				bot.sendNotification(`The ${args[0]} channel has been updated!`, 'success', msg);
				bot.saveConfig();
			}
			else if (args[1] === undefined) {
				if (selectedChannel === '') {
					bot.sendNotification(`There is no current ${args[0]} channel, all can be used!`, 'info', msg);
				}
				else {
					let channelMention = msg.guild.channels.cache.find(channel => channel.id === selectedChannel).toString();
					bot.sendNotification(`The current ${args[0]} channel is ${channelMention}`, 'info', msg);
				}
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
	help: 'Set bot-allowed text and voice channels. Putting no channel identifier will give the current channel status',
	usage: 'channel [voice | text] (channel name | all)',
};