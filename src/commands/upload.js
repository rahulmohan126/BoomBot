const fs = require('fs');
const fetch = require('node-fetch');

module.exports = {
	main: function (bot, guild, msg) {
		if (guild.checkPerms(msg.member) == 2) {
			return bot.sendNotification('You do not have permission to use this command', 'error', msg);
		}

		// Checks for mp3 files in message attachments
		const attachment = msg.attachments.first();
		if (!attachment || !attachment.name.endsWith('.mp3')) {
			return bot.sendNotification('No mp3 file was given', 'error', msg);
		}
		// Limits fize sizes to 2 MB
		else if (attachment.size > 1024 * 1024 * 3) {
			return bot.sendNotification('That file is too big', 'error', msg);
		}
		
		fetch(attachment.url).then(res => {
			dir = `./data/soundboard/${guild.id}/`;
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
			}

			res.body.pipe(fs.createWriteStream(`${dir}${attachment.name}`));
			let fileName = attachment.name.substring(0, attachment.name.length - 4);
			const command = bot.createSoundboardCommand(fileName, true);
			guild.soundboard[fileName] = command;
			bot.sendNotification(`"${fileName}" added to guild soundboard`, 'success', msg);
		});
	},
	help: 'Add a song to your guild soundboard',
	usage: 'upload (drage & drop file to add music file as attachment)',
	module: 'moderation & management'
};
