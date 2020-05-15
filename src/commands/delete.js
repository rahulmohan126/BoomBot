module.exports = {
	main: function (bot, guild, msg) {
		const fs = require('fs');
		const fetch = require('node-fetch');

		if (guild.checkPerms(msg.member) < 2) {
			let commandName = msg.content;

			if (!guild.soundboard[commandName]) {
				bot.sendNotification(`"${commandName}" does not exist`, 'success'. msg);
				return;
			}

			delete guild.soundboard[commandName];

			let dir = __dirname.split(require('path').sep);
			dir.pop();
			dir = `${dir.join('/')}/soundboard/${guild.id}/${commandName}.mp3`;

			if (fs.existsSync(dir)) {
				fs.unlinkSync(dir);
			}
			
			bot.sendNotification(`"${commandName}" deleted from the guild soundboard`, 'success', msg);
		}
		else {
			bot.sendNotification('You do not have permission to use this command', 'error', msg);
		}
	},
	help: 'Add a song to your guild soundboard',
	usage: 'upload (drage & drop file to add music file as attachment)',
	module: 'moderation & management'
};
