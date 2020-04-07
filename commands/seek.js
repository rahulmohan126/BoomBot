module.exports = {
	main: async function (bot, msg) {
		const serverQueue = bot.queue.get(msg.guild.id);

		if (!msg.member.voice.channel) {
			bot.sendNotification('You must be in a voice channel in order to use the loop command.', 'error', msg);
		}
		else if (!serverQueue) {
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

			if (parsedTime * 1000 >= serverQueue.songs[0].duration) {
				bot.sendNotification('Sorry, but that given time is greater than the duration of the song.', 'error', msg);
				return;
			}

			// Stops stream and replays with at the seeked time.
			serverQueue.seeking = true;
			serverQueue.connection.dispatcher.end();
			await bot.play(msg.guild, serverQueue.songs[0], parsedTime);
		}
	},
	help: `Skip forward/backward to a specific time of the song. Example: "seek 1h 5m 3s".`,
	usage: 'seek [time]'
};
