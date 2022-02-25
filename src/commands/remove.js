const Difflib = require('difflib');
module.exports = {
	main: function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else if (msg.member.voice.channel !== guild.queue.voice) {
			bot.sendNotification('Join the voice channel with the bot to use that command', 'error', msg);
		}
		else {
            // TODO Find optimal value for threshold
			const MATCH_THRESHOLD = 0.2;
            let songTitles = guild.queue.songs.map(s => s.title.toLowerCase());
            let matches = Difflib.getCloseMatches(msg.content, songTitles, 1, MATCH_THRESHOLD);
            if (matches.length > 0) {
				let actualSong = guild.queue.songs.filter(s => s.title.toLowerCase() == matches[0])[0].title;
                guild.queue.songs = guild.queue.songs.filter(s => s.title !== actualSong);
                bot.sendNotification(`Removed "${actualSong}" from the queue.`, 'success', msg);
            }
			else bot.sendNotification('Sorry, couldn\'t find a song with that name in the queue.', 'error', msg);
		}
	},
	help: 'Removes a song from the queue.',
	usage: 'remove [name of song]',
	module: 'music'
};