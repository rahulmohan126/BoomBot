const Bot = require('../models/bot');
const Guild = require('../models/guild');
const { ChatInputCommandInteraction } = require('discord.js');

module.exports = {
	/**
	 * @param {Bot} bot 
	 * @param {Guild} guild 
	 * @param {ChatInputCommandInteraction} int 
	 */
	main: async function (bot, guild, int) {
		const start = Date.now();
		int = await int.reply('Pong!');
		
		const latency = Date.now() - start;
		int.edit(`Pong \`(${latency}ms)\``);
	},
	help: 'Ping the server for latency',
	usage: 'ping',
	module: 'other'
};
