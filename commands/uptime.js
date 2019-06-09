module.exports = {
	main: function(bot, msg) {
		var time = (Date.now() - bot.start)/1000;
		return msg.channel.send('Uptime: `'+time+'s`');
    },
	help: '`uptime`'
};
