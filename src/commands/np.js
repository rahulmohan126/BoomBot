const BAR_LENGTH = 20;

module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			return bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}

		const ratio = (Date.now() - guild.queue.nowPlaying.startTime) / guild.queue.nowPlaying.duration;
		const leftPad = Math.round(ratio * BAR_LENGTH), rightPad = BAR_LENGTH - leftPad;
		const timeLeftInSong = guild.queue.timeToString(Date.now() - guild.queue.nowPlaying.startTime);
		const songDuration = guild.queue.timeToString(guild.queue.nowPlaying.duration);

		bot.sendNotification(`
🎶 **[${guild.queue.nowPlaying.title}](${guild.queue.nowPlaying.url})**

|${'-'.repeat(leftPad)}🔘${'-'.repeat(rightPad)}|

**Looped:** ${guild.queue.looping ? 'Looped' : 'Not looped'}
**Duration:** \`${timeLeftInSong} / ${songDuration}\`
**Requested By:** ${guild.queue.nowPlaying.requestedBy.displayName}
`, 'info', msg, [], 'Now Playing');
	},
	help: 'See what song is playing and how much time is left.',
	usage: 'np',
	module: 'music'
};
