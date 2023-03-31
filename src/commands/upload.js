module.exports = {
	main: function (bot, guild, msg) {
		const fs = require('fs');
		const fetch = require('node-fetch');

		if (guild.checkPerms(msg.member) < 2) {
			const attachment = msg.attachments.first();

			if (!attachment || !attachment.name.endsWith('.mp3')) {
				bot.sendNotification('No mp3 file was given', 'error', msg);
			}
			// Limits fize sizes to 2 MB
			else if (attachment.size > 1024 * 1024 * 3) {
				bot.sendNotification('That file is too big', 'error', msg);
			}
			else {
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
			}
		}
		else {
			bot.sendNotification('You do not have permission to use this command', 'error', msg);
		}
	},
	help: 'Add a song to your guild soundboard',
	usage: 'upload (drage & drop file to add music file as attachment)',
	module: 'moderation & management'
};
