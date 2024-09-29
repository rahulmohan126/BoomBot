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
		// Error will not be triggered if the bot is in delayedEnd as determined
		// by if there is a break time or not
		if (!guild.queue.inUse && !guild.queue.breakTime) {
			bot.sendNotification('There is no music playing at the moment...', 'error', int);
		}
		else if (int.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', int);
		}
		else {
			guild.queue.end();
			bot.sendNotification('⏹ Music stopped!', 'success', int);
		}
	},
	help: 'Stop the current song and clears song queue',
	usage: 'stop',
	module: 'music',
	aliases: ['disconnect'],
};
