module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
			let overflow = guild.queue.songs.length - 20;
			var songsInQueueStr = '';

			for (let i = 0; i < guild.queue.songs.length && i < 20; i++) {
				let song = guild.queue.songs[i];
				songsInQueueStr += `**${i + 1}.** ${song.title} | \`${guild.queue.timeToString(song.duration)}\` | ` +
					`\`Requested by ${song.requestedBy.displayName}\`\n`;
			}

			if (overflow > 0) {
				songsInQueueStr += `\n${overflow} more unlisted songs in queue.`
			}

			bot.sendNotification(`
__**Song Queue:**__

${songsInQueueStr}

**Looped:** ${guild.queue.loop ? 'Looped' : 'Not looped'}
**Now playing:** ${guild.queue.songs[0].title}
		`, 'info', msg);
		}
	},
	help: 'Gets all the songs in the queue.',
	usage: 'queue'
};
