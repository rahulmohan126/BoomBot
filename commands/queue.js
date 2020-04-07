module.exports = {
	main: function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!serverQueue) {
			bot.sendNotification('There is nothing playing.', 'error', msg);
		}
		else {
			let overflow = serverQueue.songs.length - 20;
			var songsInQueueStr = '';

			for (let i = 0; i < serverQueue.songs.length && i < 20; i++) {
				let song = serverQueue.songs[i];
				songsInQueueStr += `**${i + 1}.** ${song.title} | \`${bot.timeToString(song.duration)}\` | ` +
					`\`Requested by ${song.requestedBy.displayName}\`\n`;
			}

			if (overflow > 0) {
				songsInQueueStr += `\n${overflow} more unlisted songs in queue.`
			}

			bot.sendNotification(`
__**Song Queue:**__

${songsInQueueStr}

**Looped:** ${serverQueue.loop ? 'Looped' : 'Not looped'}
**Now playing:** ${serverQueue.songs[0].title}
		`, 'info', msg);
		}
	},
	help: 'Gets all the songs in the queue.',
	usage: 'queue'
};
