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
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', int);
		}
		else if (int.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', int);
		}
		else if (!guild.queue.playing) {
			guild.queue.playing = true;
			guild.queue.player.unpause();
			bot.sendNotification('▶ Music resumed!', 'success', int);
		}
		else {
			bot.sendNotification('▶ Music is already playing', 'success', int);
		}
	},
	help: 'Resumes the current song.',
	usage: 'resume',
	module: 'music',
	aliases: ['unpause']
};
