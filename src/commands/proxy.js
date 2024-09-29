const PROTOCOL = 'https?:\\/\\/';
const DOMAIN = '(?!-)([a-zA-Z0-9-]{1,63}(?<!-)\\.)+[a-zA-Z]{2,}';
const IP_ADRR = '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
const PORT = ':\\d{1,5}'
const PROXY_REGEX = new RegExp(`^(${PROTOCOL})((${DOMAIN})|(${IP_ADRR}))(${PORT})$`);

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
        // Ignore non-owner users
        if (guild.checkPerms(int.member) !== 0) {
            return;
        }

        var address = int.options.getString('proxy-link');

        if (address === 'off') {
			address = null;
		}
        else if (!address.match(PROXY_REGEX)) {
            return;
        }

        bot.buildAgent(address);
        bot.sendNotification('Proxy changed!', 'success', int);
    },
    help: 'Pro',
    usage: 'proxy [new proxy]',
    module: 'admin',
    hide: true
}