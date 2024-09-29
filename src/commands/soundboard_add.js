const fs = require('fs');
const fetch = require('node-fetch');

const Bot = require('../models/bot');
const Guild = require('../models/guild');
const { ChatInputCommandInteraction } = require('discord.js');

module.exports = {
	/**
	 * @param {Bot} bot 
	 * @param {Guild} guild 
	 * @param {ChatInputCommandInteraction} int 
	 */
	main: async function (bot, guild, int) {
		if (guild.checkPerms(int.member) === 2) {
			return bot.sendNotification('You do not have permission to use this command', 'error', int);
		}

		// Checks for mp3 files in message attachments
		const attachment = int.options.getAttachment('sound');
		if (!attachment || !attachment.name.endsWith('.mp3')) {
			return bot.sendNotification('No mp3 file was given', 'error', int);
		}
		// Limits fize sizes to 2 MB
		else if (attachment.size > 1024 * 1024 * 3) {
			return bot.sendNotification('That file is too big', 'error', int);
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
			bot.sendNotification(`"${fileName}" added to guild soundboard`, 'success', int);
		});
	},
	help: 'Add a song to your guild soundboard',
	usage: 'upload (drage & drop file to add music file as attachment)',
	module: 'moderation & management'
};
