module.exports = {
	main: function(bot, msg) {
		var start = Date.now();
		msg.channel.send('Pong!').then(function(newMsg) {
			var stop = Date.now();
			var latency = stop - start;
			return newMsg.edit('Pong `('+latency+'ms)`');
		});
	},
	help: '`ping`'
};
