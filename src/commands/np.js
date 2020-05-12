module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
			const timeLeftInSong = guild.queue.timeToString(Date.now() - guild.queue.songs[0].startTime);
			const songDuration = guild.queue.timeToString(guild.queue.songs[0].duration);

			bot.sendNotification(`
🎶 Now playing: **${guild.queue.songs[0].title}**

**Looped:** ${guild.queue.loop ? 'Looped' : 'Not looped'}
**Duration:** \`${timeLeftInSong} / ${songDuration}\`
**Requested By:** ${guild.queue.songs[0].requestedBy.displayName}
`, 'info', msg);
		}
	},
	help: 'See what song is playing and how much time is left.',
	usage: 'np'
};
