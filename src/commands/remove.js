module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			return bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else if (msg.member.voice.channel !== guild.queue.voice) {
			return bot.sendNotification('Join the voice channel with the bot to use that command', 'error', msg);
		}
		
		const val = Math.floor(Number(msg.content)) - 1;
		if (0 <= val && val < guild.queue.songs.length) {
			let s = guild.queue.songs.splice(val, 1)[0];
			bot.sendNotification(`Removed "${s.title}" from the queue.`, 'success', msg);
		}
		else {
			bot.sendNotification('Sorry, that isn\'t a valid position in the queue.', 'error', msg);
		}
	},
	help: 'Removes a song from the queue.',
	usage: 'remove [position in queue]',
	module: 'music'
};