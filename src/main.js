'use strict';
const startTime = Date.now();

//#region  ---------------------	Packages	---------------------
const fs = require('fs');
const { GatewayIntentBits } = require('discord.js');
const Bot = require("./models/bot");

//#endregion
//#region  ---------------------	Setup		---------------------
process.env.LOGGING = true;

const config = JSON.parse(fs.readFileSync(`./settings.json`));
const cookies = JSON.parse(fs.readFileSync(`./cookies.json`));
const bot = new Bot({ autoReconnect: true, intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildVoiceStates
] }, config, cookies);

//#endregion
//#region  ---------------------	Handlers	---------------------

bot.on('ready', () => {
	bot.start();
	bot.user.setActivity(`over ${bot.guilds.cache.size} servers...`, { type: 'WATCHING' });

	const startuptime = Date.now() - startTime;
	if (process.env.LOGGING) {
		console.log("ACTIVE SERVERS: ")
		bot.guilds.cache.each(guild => console.log(`${guild.id} | ${guild.name}`));
	}
	console.log(`\nReady to begin! Serving in ${bot.guilds.cache.size} servers. Startup time: ${startuptime}ms`);
});

bot.on('messageCreate', msg => {
	const guild = bot.getGuild(msg.guild);
	if (msg.author.id === bot.ID || !guild.validMessage(msg)) {
		return;
	}

	const command = guild.extractCommand(msg);

	if (bot.commandDict[command]) {
		// Logs guild, author, and message if enabled
		if (process.env.LOGGING) bot.log['commandMsg'](msg, command);

		// Runs the command
		bot.runCommand(command, guild, msg);
	}
	// Seperate condition for guild soundboards.
	else if (guild.hasSoundboard(command)) {
		// Logs guild, author, and message if enabled
		if (process.env.LOGGING) bot.log['commandMsg'](msg, command);

		// Runs the command
		guild.soundboard[command].main(bot, guild, msg);
	}
});

bot.on('voiceStateUpdate', (oldState, newState) => {
	const guild = bot.getGuild(oldState.guild);

	if (guild.queue.voice && guild.queue.voice.id === oldState.channelId) {
		let channelMembers = oldState.channel.members;
		// Leaves vc if the only user in the vc is the bot itself
		if (channelMembers.size === 1 && channelMembers.firstKey() === bot.ID) {
			bot.sendNotification('⏹ Music stopped since everyone left the channel.', 'info', {
				channel: guild.queue.text, member: oldState.member
			});
			guild.queue.end();
		}
	}
});

bot.on('error', (err) => {
	console.error('—————————— ERROR ——————————');
	console.error(err);
	console.error('———————— END ERROR ————————');
});

bot.on('disconnected', () => {
	console.error('——————— DISCONNECTED ——————');
});

bot.on('guildCreate', guild => {
	bot.user.setActivity(`over ${bot.guilds.cache.size} servers...`, { type: 'WATCHING' });
	bot.getGuild(guild); // Initializes a new guild
	if (process.env.LOGGING) console.log(`New guild: ${guild.name}`);
})

bot.login(bot.TOKEN);

//#endregion