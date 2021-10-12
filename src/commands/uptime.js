module.exports = {
	main: function (bot, guild, msg) {
		const time = Math.round((Date.now() - bot.START_TIME) / 1000);
		
		let timeString = '';
		if (time > 60 * 60 * 24) {
			timeString += Math.floor(time / (60 * 60 * 24)) + 'd ';
			time %= 60 * 60 * 24;
		}
		if (time > 60 * 60) {
			timeString += Math.floor(time / (60 * 60)) + 'h ';
			time %= 60 * 60;
		}
		if (time > 60) {
			timeString += Math.floor(time / 60) + 'm ';
			time %= 60 * 60;
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
