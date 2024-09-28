const MIN_SEC = 60;
const HR_SEC = MIN_SEC * 60
const DAYS_SEC = HR_SEC * 24;

module.exports = {
	main: function (bot, guild, msg) {
		var time = Math.round((Date.now() - bot.START_TIME) / 1000);
		
		let timeString = '';
		if (time > DAYS_SEC) {
			timeString += Math.floor(time / DAYS_SEC) + 'd ';
			time %= DAYS_SEC;
		}
		if (time > HR_SEC) {
			timeString += Math.floor(time / HR_SEC) + 'h ';
			time %= HR_SEC;
		}
		if (time > MIN_SEC) {
			timeString += Math.floor(time / MIN_SEC) + 'm ';
			time %= MIN_SEC;
		}
		if (time > 0) {
			timeString += time + 's';
		}

		msg.channel.send(`Uptime: \`${timeString}\``);
	},
	help: 'See how long the server has been online.',
	usage: 'uptime',
	module: 'other'
};
