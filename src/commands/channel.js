module.exports = {
	main: function (bot, guild, msg) {
		const args = msg.content.split(' ');

		var channelType = args[0].toLowerCase();
		var channelName = args[1];

		if (channelName) {
			if (!(guild.checkPerms(msg.member) < 2)) {
				bot.sendNotification(`You do not have the permissions neccessary to change channel settings`, 'error', msg);
				return;
			}

			if (!channelType) {
				bot.sendNotification(`The channel types are "voice" or "text"`, 'error', msg);
				return;
			}
			else if (channelType == 'text' || channelType == 'voice') {
				var channelID;
				var channel;
				// Checks for all
				if (channelName == 'all') channelID = 'all';
				// Checks for valid channel name
				else {
					channel = guild.channels.cache.find(channel => channel.name === channelName);
					if (channel) {
						channelID = channel.id;
					}
				}

				if (channelID) {
					let actualID = channelID == 'all' ? '' : channelID;

					if (channelType == 'text') guild.textChannel = actualID;
					else guild.voiceChannel = actualID;

					guild.save();
					bot.sendNotification(`The channel is ${channelType} channel is now ${channel || 'all'}`, 'success', msg);
					return;
				}
			}
			bot.sendNotification(`No valid channel given.`, 'error', msg);
		}
		else {
			if (!channelType) {
				bot.sendNotification(`The channel types are "voice" or "text"`, 'error', msg);
				return;
			}
			else if (channelType == 'text' || channelType == 'voice') {
				let selectedChannel = channelType == 'text' ? guild.textChannel : guild.voiceChannel;
				let channel = msg.guild.channels.cache.find(channel => channel.id === selectedChannel);

				bot.sendNotification(`The current ${channelType} channel is ${channel || 'all'}`, 'info', msg);
			}
		}

	},
	help: 'Set bot-allowed text and voice channels. Putting no channel identifier will give the current channel status',
	usage: 'channel [voice | text] (channel name | all)',
	module: 'moderation & management'
};