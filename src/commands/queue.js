const QUEUE_LIMIT = 20

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

		var queueStr = '';
		
		const numOutput = Math.min(guild.queue.songs.length, QUEUE_LIMIT);
		const numOverflow = guild.queue.songs.length - QUEUE_LIMIT;
		for (let i = 0; i < numOutput; i++) {
			let song = guild.queue.songs[i];
			queueStr += `**${i + 1}.** ${song.title} | \`${guild.queue.timeToString(song.duration)}\` | ` +
				`\`Requested by ${song.requestedBy.displayName}\`\n`;
		}

		if (numOverflow > 0) {
			queueStr += `\n${numOverflow} more unlisted songs in queue.`
		}

		bot.sendEmbed('Song Queue', `
${queueStr}

**Looped:** ${guild.queue.looping ? 'Looped' : 'Not looped'}
**Now playing:** ${guild.queue.nowPlaying.title}
**Time Left in Queue:** ${guild.queue.timeToString(guild.queue.totalTime)}
		`, 'info', int);
	},
	help: 'Gets all the songs in the queue.',
	usage: 'queue',
	module: 'music'
};
