module.exports = {
    main: function (bot, guild, msg) {
        const GUILD_PREFIX = bot.getGuild(msg.guild).prefix;

        if (msg.content !== '') {
            let command = bot.commands.filter(item => item.name === msg.content)[0] || guild.soundboard[msg.content];
            if (!command) {
                return bot.sendNotification('That command does not exist', 'error', msg);;
            }

            const text = `Bot prefix: ${GUILD_PREFIX} | Command: ${command.name}`;
            const fields = [
                { name: 'Description: ', value: command.help },
                { name: 'Usage: ', value: GUILD_PREFIX + command.usage }
            ]

            return bot.sendNotification(text, 'info', msg, fields);
        }

        const cmds = {};
        for (let command of bot.commands) {
            if (command.hide) {
                continue;
            }
            
            if (!cmds[command.module]) {
                cmds[command.module] = [];
            }
            cmds[command.module].push(command.name);
        }

        let embedList = [];
        for (let key in cmds) {
            embedList.push({
                name: `${key}`,
                value: cmds[key].join(', '),
                inline: false
            });
        }

        let soundboardItems = !Object.keys(guild.soundboard).length ? '---' : Object.keys(guild.soundboard).join(', ');
        embedList.push({
            name: 'soundboard',
            value: soundboardItems,
            inline: false
        })

        bot.sendNotification(`Bot prefix: ${GUILD_PREFIX} | See more using: \`help <command name>\``, 'info', msg, embedList);
    },
    help: 'Help command',
    usage: 'help (name of command)',
    module: 'other'
}