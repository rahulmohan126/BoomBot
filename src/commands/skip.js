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
			bot.sendNotification('There is nothing playing that I could skip for you.', 'error', int);
		}
		else if (int.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', int);
		}
		else {
			guild.queue.player.stop();
			bot.sendNotification('▶︎▶︎ Music skipped!', 'success', int);
		}
	},
	help: 'Skips the current song to the next one in the queue.',
	usage: 'skip',
	module: 'music'
};
