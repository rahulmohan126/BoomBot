module.exports = {
	main: async function (bot, guild, msg) {
		if (!guild.queue.inUse) {
			bot.sendNotification('There is no music playing at the moment...', 'error', msg);
		}
		else {
			// Converts the raw input string (ex. "10m 5s" into seconds => 605)

			let args = msg.content.split(' ');
			let parsedTime = 0;

			const TIME_VALUES = [1, 60, 3600];
			const TIME_INDICATORS = ['s', 'm', 'h'];
			for (let i in args) {
				let arg = args[i];

				let indicatorIndex = TIME_INDICATORS.indexOf(arg.substring(0, 1));
				if (indicatorIndex === -1) indicatorIndex = TIME_INDICATORS.indexOf(arg.substring(arg.length - 1));

				parsedTime += Number(arg.replace(TIME_INDICATORS[indicatorIndex], '')) * TIME_VALUES[indicatorIndex];
			}

			if (parsedTime * 1000 >= guild.queue.songs[0].duration) {
				bot.sendNotification('Sorry, but that given time is greater than the duration of the song.', 'error', msg);
				return;
			}

			// Stops stream and replays with at the seeked time.
			guild.queue.seeking = true;
			guild.queue.connection.dispatcher.end();
		
			// The only problem with this is that discord.js needs to scan through
			// the entire stream to get to "seeked" time, so the farther the seek time
			// is into the stream, the greater the delay will be. No current work arounds for this.
			// Ex. => "seek 10s" delay < "seek 10m" delay
			await guild.queue.play(guild.queue.songs[0], parsedTime);
		}
	},
	help: `Skip forward/backward to a specific time of the song. Example: "seek 1h 5m 3s".`,
	usage: 'seek [time]'
};
