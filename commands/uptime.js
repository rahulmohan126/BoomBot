module.exports = {
	main: function (bot, msg) {
		const time = (Date.now() - bot.start) / 1000;
		msg.channel.send(`Uptime: \`${time}s\``);
	},
	help: 'See how long the server has been online.',
	usage: 'uptime'
};
