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
		else {
			guild.queue.looping = !guild.queue.looping;
			bot.sendNotification(`⟲ Music ${guild.queue.looping ? '' : 'de'}looped!`, 'success', int);
		}
	},
	help: 'Endlessly replay a song. Can be disabled by using "loop" again or ending music.',
	usage: 'loop',
	module: 'music'
};
