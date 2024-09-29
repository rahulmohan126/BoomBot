const Bot = require('../models/bot');
const Guild = require('../models/guild');
const { ChatInputCommandInteraction } = require('discord.js');
const fs = require('fs');

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

		const soundName = int.options.getString('sound');

		if (!guild.soundboard[soundName]) {
			return bot.sendNotification(`"${soundName}" does not exist`, 'success'. int);
		}

		delete guild.soundboard[soundName];
		dir = `./data/soundboard/${guild.id}/${soundName}.mp3`;
		if (fs.existsSync(dir)) {
			fs.unlinkSync(dir);
		}
		
		bot.sendNotification(`"${soundName}" deleted from the guild soundboard`, 'success', int);
	},
	help: 'Add a song to your guild soundboard',
	usage: 'upload (drage & drop file to add music file as attachment)',
	module: 'moderation & management'
};
