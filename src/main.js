'use strict';
const startTime = Date.now();

//#region  ---------------------	Packages	---------------------
const fs = require('fs');
const Discord = require('discord.js');
const { GatewayIntentBits } = require('discord.js');
const Bot = require('./models/bot');

//#endregion
//#region  ---------------------	Setup		---------------------

const config = JSON.parse(fs.readFileSync(`./settings.json`));
const cookies = JSON.parse(fs.readFileSync(`./cookies.json`));
const bot = new Bot(startTime, { autoReconnect: true, intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildVoiceStates
] }, config, cookies);

bot.initHandlers();
bot.login(bot.TOKEN);

//#endregion