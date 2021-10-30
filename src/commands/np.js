module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
			const ratio = (Date.now() - guild.queue.nowPlaying.startTime) / guild.queue.nowPlaying.duration;
			const barLength = 20;
			const timeLeftInSong = guild.queue.timeToString(Date.now() - guild.queue.nowPlaying.startTime);
			const songDuration = guild.queue.timeToString(guild.queue.nowPlaying.duration);

			bot.sendNotification(`
🎶 **[${guild.queue.nowPlaying.title}](${guild.queue.nowPlaying.url})**

|${'-'.repeat(Math.round(ratio * barLength))}🔘${'-'.repeat(Math.round((1 - ratio) * barLength))}|

**Looped:** ${guild.queue.loop ? 'Looped' : 'Not looped'}
**Duration:** \`${timeLeftInSong} / ${songDuration}\`
**Requested By:** ${guild.queue.nowPlaying.requestedBy.displayName}
`, 'info', msg, [], 'Now Playing');
		}
	},
	help: 'See what song is playing and how much time is left.',
	usage: 'np',
	module: 'music'
};
