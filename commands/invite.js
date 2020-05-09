module.exports = {
	main: function (bot, guild, msg) {
		// Permissions can be calculated either at https://discordapi.com/permissions.html or in the developer portal, under the bot
		// tab on your application. These are the permissions your bot gains once being invited into a server.
		const PERMISSIONS = 36719616;
		const DESCRIPTION = `[Add the bot to your server!](https://discordapp.com/api/oauth2/authorize?client_id=${bot.ID}` +
			`&permissions=${PERMISSIONS}&scope=bot)\n\n[Source & Creator](https://github.com/rahulmohan126/boombot)`

		bot.sendNotification(DESCRIPTION, 'info', msg);
	},
	help: 'Creates a bot invite link to add to other servers and credits the original creator of the bot.',
	usage: 'invite',
};