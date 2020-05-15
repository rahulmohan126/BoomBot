module.exports = {
	main: function (bot, guild, msg) {
		const time = (Date.now() - bot.START_TIME) / 1000;
		msg.channel.send(`Uptime: \`${time}s\``);
	},
	help: 'See how long the server has been online.',
	usage: 'uptime',
	module: 'other'
};
