const BAR_LENGTH = 20;
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
		

		const progress = guild.queue.resource.playbackDuration;
		const ratio = progress / guild.queue.nowPlaying.duration;

		const leftPad = Math.round(ratio * BAR_LENGTH), rightPad = BAR_LENGTH - leftPad;
		const timeLeftInSong = guild.queue.timeToString(progress);
		const songDuration = guild.queue.nowPlaying.durationStr;

		bot.sendEmbed('Now Playing', `
🎶 **[${guild.queue.nowPlaying.title}](${guild.queue.nowPlaying.url})**

|${'-'.repeat(leftPad)}🔘${'-'.repeat(rightPad)}|

**Looped:** ${guild.queue.looping ? 'Looped' : 'Not looped'}
**Duration:** \`${timeLeftInSong} / ${songDuration}\`
**Requested By:** ${guild.queue.nowPlaying.requestedBy.displayName}
`, 'info', int);
	},
	help: 'See what song is playing and how much time is left.',
	usage: 'np',
	module: 'music'
};
