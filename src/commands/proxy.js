const PROTOCOL = 'https?:\\/\\/';
const DOMAIN = '(?!-)([a-zA-Z0-9-]{1,63}(?<!-)\\.)+[a-zA-Z]{2,}';
const IP_ADRR = '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
const PORT = ':\\d{1,5}'
const PROXY_REGEX = new RegExp(`^(${PROTOCOL})((${DOMAIN})|(${IP_ADRR}))(${PORT})$`);

module.exports = {
    main: function (bot, guild, msg) {
        // Ignore non-owner users
        if (guild.checkPerms(msg.member) !== 0) {
            return;
        }

        if (msg.content === "off") {
			msg.content = null;
		}
        else if (!msg.content.match(PROXY_REGEX)) {
            return;
        }

        bot.buildAgent(msg.content);
        bot.sendNotification('Proxy changed!', 'success', msg);
    },
    help: 'Pro',
    usage: 'proxy [new proxy]',
    module: 'admin',
    hide: true
}