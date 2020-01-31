'use strict';
const startTime = Date.now();
//#region  ---------------------	Packages	---------------------
const Discord = require('discord.js');
const YouTube = require('simple-youtube-api');
const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');
const bot = new Discord.Client({autoReconnect: true});
//#endregion
//#region  ---------------------	  Bot		---------------------

// Required
const config = JSON.parse(fs.readFileSync(__dirname+'/settings.json'));
bot.ID = config.BOTID;
bot.OWNERID = config.OWNERID;
bot.PREFIX = config.PREFIX;
bot.TOKEN = config.TOKEN;
bot.GOOGLE_API_KEY = config.GOOGLE_API_KEY;

// Colors
bot.COLOR = 0x351C75;
bot.SUCCESS_COLOR = 0x66bb69;
bot.ERROR_COLOR = 0xEF5250;
bot.INFO_COLOR = 0x03A8F4;

// Other
const youtube = new YouTube(bot.GOOGLE_API_KEY);
bot.start = startTime;
bot.db = JSON.parse(fs.readFileSync(__dirname+'/guild.json'));
bot.queue = new Map();
bot.DETAILED_LOGGING = true;

// Functions
bot.sendNotification = function(info, code, msg) {
	var color;

	switch (code) {
		case 'success':
			color = bot.SUCCESS_COLOR;
			break;
		case 'error':
			color = bot.ERROR_COLOR;
			break;
		case 'info':
			color = bot.INFO_COLOR;
			break;
		default:
			color = bot.COLOR;
			break;
	}

	let embed = {
		color: color,
		description: info
	};

	msg.channel.send('', {embed});
};

// YouTube duration (string) to seconds (number)
bot.durationSeconds = function(duration) {
	const letter = ['S', 'M', 'H'];
	const value = [1, 60, 360];
	const durationComponents = duration.slice(2, duration.length).split(/(.+?[A-Z])/g);

	var time = 0;

	durationComponents.forEach(element => {
		if (element != '') {
			time += parseInt(element.slice(0, element.length - 1)) * value[letter.indexOf(element[element.length - 1])];
		}
	});

	return(time * 1000);
};

// Returns formatted duration
bot.timeToString = function(duration) {
	if (typeof duration === 'string') {
		let durationComponents = duration.slice(2, duration.length).toLowerCase().split(/(.+?[a-z])/g).filter(x => x != '');
		for (var i = 0; i < durationComponents.length; i++) {
			durationComponents[i] = durationComponents[i].slice(0, durationComponents[i].length - 1)
			while (durationComponents[i].length != 2) {
				durationComponents[i] = '0' + durationComponents[i];
			}
		}

		return(durationComponents.join(' '));
	}
	else {
		var timeArray = [];

		while (duration > 0 && timeArray.length < 3) {
			timeArray.unshift(duration % 60);
			duration = Math.floor(duration / 60);
		}

		timeArray.unshift(duration);

		for (var i = 0; i < timeArray.length; i++) {
			while (durationComponents[i].length != 2) {
				durationComponents[i] = '0' + durationComponents[i];
			}
		}

		return(timeArray.join(' '));
	}
};

// Time until next song
bot.timeToSong = function(serverMap) {
	var totalTime = serverMap.songs.reduce((sum, song) => sum + bot.durationSeconds(song.duration));
	totalTime -= Math.floor((Date.now() - serverMap.songs[0].start) / 1000);
	return bot.timeToString(totalTime);
};

// Handles video requests from play command
bot.handleVideo = async function(video, msg, voiceChannel, playlist = false) {
	const serverQueue = bot.queue.get(msg.guild.id);
	video = await youtube.getVideoByID(video.id);
	const song = {
		id: video.id,
		title: Discord.Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`,
		thumbnail: video.thumbnails.default.url,
		duration: video.raw.contentDetails.duration,
		start: 0
	};

	let x = bot.durationSeconds(song.duration);

	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		bot.queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			queueConstruct.songs[0] = bot.play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			bot.queue.delete(msg.guild.id);
			return msg.channel.send(`I could not join the voice channel: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		if (playlist) return undefined;
		else return msg.channel.send(`✅ **${song.title}** has been added to the queue! It will begin playing in ${bot.timeToSong(serverQueue)}`);
	}
	return undefined;
};

// Plays stream of first video in server map
bot.play = function(guild, song) {
	const serverQueue = bot.queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		bot.queue.delete(guild.id);
		return;
	}


	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') {
				serverQueue.textChannel.send('Sorry, slow network connection...');
			}
			if (bot.DETAILED_LOGGING) console.error(`Guild: ${serverQueue.textChannel.guild.name} (${serverQueue.textChannel.guild.id}) | Audio Disconnection: ${reason}`);

			serverQueue.songs.shift();
			song = bot.play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	bot.sendNotification(`🎶 Start playing: **${song.title}**`, 'success', {'channel' : serverQueue.textChannel.id});

	song.start = Date.now();
	return song;
};

// Gets a guild config from id
bot.getGuild = function (guildID) {
	// In case bot guild has been deleted or not created yet
	if (!bot.db[guildID]) {
		bot.db[guildID] = {
			prefix: ".",
			channels: {
				text: [],
				voice: []
			}
		};

		bot.saveConfig();
	}

	return(bot.db[guildID]);
};

// Saves guild config database to file
bot.saveConfig = function() {
	fs.writeFileSync(__dirname+'/guild.json', JSON.stringify(bot.db, null, 4));
};

//#endregion
//#region  ---------------------	Commands	---------------------

var commands = {};

// BASE COMMANDS (cannot be reloaded)

commands.help = {};
commands.help.args = '';
commands.help.help = '';
commands.help.hide = true;
commands.help.main = function(bot, msg) {

	if (msg.content.split(' ').length < 2) {
		var cmds = [];

		for (let command in commands) {
			if (!commands[command].hide) {
				cmds.push(command);
			}
		}

		cmds = cmds.join(', ');

		let embed = {
			color: bot.INFO_COLOR,
			description: 'Bot prefix: '+bot.getGuild(msg.guild.id).prefix,
			fields: [
				{
				name: 'Commands: ',
				value: cmds,
				inline: true
				}
			],
			footer: {
				icon_url: bot.user.avatarURL,
				text: bot.user.username
			}
		};

		msg.channel.send('', {embed});
	}
	else {
		let command = msg.content.split(' ')[1];

		if (commands[command]) {
			let embed = {
				color: bot.INFO_COLOR,
				description: 'Bot prefix: '+bot.getGuild(msg.guild.id).prefix,
				fields: [
					{
					name: command,
					value: commands[command].help,
					}
				],
				footer: {
					icon_url: bot.user.avatarURL,
					text: bot.user.username
				}
			};
			msg.channel.send('', {embed});
		}
		else {
			bot.sendNotification('That command does not exist', 'error', msg);
		}
	}
};

commands.reload = {};
commands.reload.args = '';
commands.reload.help = '';
commands.reload.hide = true;
commands.reload.main = function(bot, msg) {
	let command = msg.content.split(' ')[0];

	if (msg.author.id === bot.OWNERID){
		try {
			if (commands[command]) {

				var directory = __dirname+'/commands/'+command+'.js';
				delete commands[command];
				delete require.cache[directory];
				commands[command] = require(directory);
				bot.sendNotification(`Reloaded ${command} command successfully.`, 'success', msg);

				if (bot.DETAILED_LOGGING) console.log(`Command: "${command}" | Status: Reloaded`);
			}
		}
		catch(err){
			bot.sendNotification('Command not found', 'error', msg);
		}
	}
	else {
		bot.sendNotification('You do not have permission to use this command.', 'error', msg);
	}
};

//#endregion
//#region  ---------------------	Functions   ---------------------

var consoleListener = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

// Checks if text channel is permitted to use bot commands in.
var commandsAllowed = function(msg) {
	let guildChannels = bot.getGuild(msg.guild.id).channels.text;

	if (guildChannels.length === 0 || msg.author.id === msg.guid.ownerID) {
		return(true);
	}
	else if (guildChannels.includes(msg.channel.id)) {
		return(true);
	}
	else {
		return(false);
	}
};

// Loads commands in from ./commands folder
var loadCommands = function() {
	var files = fs.readdirSync(__dirname+'/commands/');

	for (let file of files) {
		if (file.endsWith('.js')) {
			commands[file.slice(0, -3)] = require(__dirname+'/commands/'+file);
			if (bot.DETAILED_LOGGING) console.log(`Command: ${file.slice(0, -3)} | Status: Loaded`);
		}
	}

	console.log('———— All Commands Loaded! ————');
};

//#endregion
//#region  ---------------------	Handlers	---------------------

bot.on('ready', () => {
	bot.user.setActivity(`over ${bot.guilds.array().length} servers...`, { type: 'WATCHING' });
	loadCommands();
	const startuptime = Date.now() - startTime;
	console.log(`Ready to begin! Serving in ${bot.guilds.array().length} servers. Startup time: ${startuptime}ms`);
});

bot.on('message', msg => {
	const guildPrefix = bot.getGuild(msg.guild.id).prefix;

	if (msg.author.id != bot.ID && msg.content.startsWith(guildPrefix) && commandsAllowed(msg)) {
		const command = msg.content.split(' ')[0].slice(guildPrefix.length);
		msg.content = msg.content.slice(guildPrefix.length + command.length).trimLeft(); // Just the args, removes the prefix and command

		if (bot.DETAILED_LOGGING) console.log(`Guild: ${msg.guild.name} (${msg.guild.id}) | Author: ${msg.author.guildName} (${msg.author.id}) | Message: ${guildPrefix} ${msg.content}`);

		if (commands[command]) {
			if (command === 'play') {
				commands[command].main(bot, msg, youtube);
			}
			else {
				commands[command].main(bot, msg);
			}
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
	bot.user.setActivity(`over ${bot.guilds.array().length} servers...`, { type: 'WATCHING' });
	bot.getGuild(guild.id); // Initializes a new guild
    if (bot.DETAILED_LOGGING) console.log(`New guild: ${guild.name}`);
})

bot.login(bot.TOKEN);

consoleListener.on('line', function (input) {
	if (input.includes('stop')) {
		bot.destroy();
		process.exit(0);
	}
});

//#endregion