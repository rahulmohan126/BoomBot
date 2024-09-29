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
			return bot.sendNotification('There is no music playing at the moment...', 'error', int);
		}
		else if (int.member.voice.channel !== guild.queue.voice) {
			return bot.sendNotification('Join the voice channel with the bot to use that command', 'error', int);
		}
		
		const pos = int.options.getInteger('position') - 1;
		if (0 <= pos && pos < guild.queue.songs.length) {
			let s = guild.queue.songs.splice(pos, 1)[0];
			bot.sendNotification(`Removed "${s.title}" from the queue.`, 'success', int);
		}
		else {
			bot.sendNotification('Sorry, that isn\'t a valid position in the queue.', 'error', int);
		}
	},
	help: 'Removes a song from the queue.',
	usage: 'remove [position in queue]',
	module: 'music'
};