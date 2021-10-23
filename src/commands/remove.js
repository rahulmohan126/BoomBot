const Difflib = require('difflib');
module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
            // TODO Find optimal value for threshold
            const MATCH_THRESHOLD = 0.2;
            let songTitles = guild.queue.songs.map(s => s.title);
            let matches = Difflib.getCloseMatches(msg.content, songTitles, 1, MATCH_THRESHOLD);
            if (matches.length > 0) {
                guild.queue.songs = guild.queue.songs.filter(s => s.title != matches[0]);
                bot.sendNotification(`Removed ${matches[0]} from the queue.`, 'success', msg);
            }
			else bot.sendNotification('Sorry, couldn\'t find a song with that name in the queue.', 'error', msg);
		}
	},
	help: 'Removes a song from the queue.',
	usage: 'remove [name of song]',
	module: 'music'
};