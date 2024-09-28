module.exports = {
	main: function (bot, guild, msg) {
		const fs = require('fs');
		const fetch = require('node-fetch');

		if (guild.checkPerms(msg.member) === 2) {
			return bot.sendNotification('You do not have permission to use this command', 'error', msg);
		}

		let commandName = msg.content;

		if (!guild.soundboard[commandName]) {
			return bot.sendNotification(`"${commandName}" does not exist`, 'success'. msg);
		}

		delete guild.soundboard[commandName];
		dir = `./data/soundboard/${guild.id}/${commandName}.mp3`;
		if (fs.existsSync(dir)) {
			fs.unlinkSync(dir);
		}
		
		bot.sendNotification(`"${commandName}" deleted from the guild soundboard`, 'success', msg);
	},
	help: 'Add a song to your guild soundboard',
	usage: 'upload (drage & drop file to add music file as attachment)',
	module: 'moderation & management'
};
